# Backend spec: edit, delete and code-protected deactivate for staff accounts

For whoever owns the backend (`PropertyManagementRepo`). The admin console (Admin team page) needs three
changes. Every one needs the acting SuperAdmin's authenticator `code`, checked with `StepUpVerifier`, exactly
like `SetStaffRolesCommand` does today. Controller: `AdminStaffController` (`staff.manage`, SuperAdmin only).

## 1. Edit details: `PUT /api/v1/admin/staff/{userId}`

Body: `{ "FullName": string, "Email": string, "Code": string }`. Answers `204`.
- New `UpdateStaffCommand` in `Users/Application/Admin/Commands`, same shape as `SetStaffRolesCommand`
  (find with `StaffAccountGuard.FindStaffAsync`, refuse own account with `OwnAccount`, verify the code).
- Validate with the same rules as `CreateStaffCommand` (name length, `StaffEmailPolicy` for the email). Refuse an
  email another account already uses (409-style `StaffFailure`).
- If the email changed: update `UserName` and `NormalizedEmail` through `UserManager`, set `EmailConfirmed` as
  create does, update the security stamp and revoke refresh tokens, and send a notice to the OLD address.
- Audit: new action `AuditActions.Staff.Updated` (`staff.updated`) with `Before` / `After` (name and email).
- Call `_staffAccess.InvalidateAsync(userId)` in the controller, as the other endpoints do.

## 2. Delete: `DELETE /api/v1/admin/staff/{userId}`

Body: `{ "Code": string }`. Answers `204`. (If a DELETE body is awkward, use `POST .../{userId}/delete`.)
- New `DeleteStaffCommand`. Refuse own account and the last active SuperAdmin (same guard and lock as deactivate).
- Recommended: soft delete. Anonymise the account (e.g. email `deleted-<id>@deleted.invalid`, name "Deleted staff"),
  set `IsActive = false`, remove roles, revoke refresh tokens, update the security stamp. Keep the row so the
  audit log's `SubjectUserId` and `ActorUserId` references stay valid. A hard delete would orphan audit history.
- Audit: new action `AuditActions.Staff.Deleted` (`staff.deleted`), written BEFORE the email is anonymised so the
  entry names who was deleted. Send a notice to the old address.
- The staff list should stop returning deleted accounts (filter on a `DeletedAt` column or on the anonymised email).

## 3. Deactivate asks for a code: `POST /api/v1/admin/staff/{userId}/deactivate`

Body changes from none to `{ "Code": string }` (use the existing `StaffCodeRequest`).
- Add `string? Code` to `DeactivateStaffCommand` and verify it with `StepUpVerifier` before the transaction,
  as `ReactivateStaffCommand` does.
- This is a breaking change for the admin console's current Deactivate button. The console is updated in step with
  it, so deploy both together.

## Check afterwards
Create a throwaway staff account, then edit, deactivate, reactivate and delete it. Confirm each appears under
`/audit-log` (module `staff`) and that a wrong code is refused each time.
