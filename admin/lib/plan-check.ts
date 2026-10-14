import type { AdminPackage, LandlordSubscription, LimitViolation } from "@/lib/types";

// Works out which limits of `target` the landlord's current usage would break.
//
// This is a PREVIEW so the admin sees the problem before submitting. The backend repeats the same check
// when the change is sent and always has the final say (PlanChangeChecker.cs).
//
// Same rule as the backend: usage may not be above (plan limit + any extra allowance support granted).
export function findViolations(
  target: AdminPackage,
  current: AdminPackage | undefined,
  subscription: LandlordSubscription,
): LimitViolation[] {
  const violations: LimitViolation[] = [];

  for (const targetLimit of target.limits) {
    const usage = subscription.limits.find((l) => l.key === targetLimit.key);
    // No usage figure for this limit means there's nothing to compare (the backend skips it too).
    if (!usage) continue;

    // The subscription's limit includes support overrides; the catalog's does not. The gap is the extra allowance.
    const currentPlanLimit = current?.limits.find((l) => l.key === targetLimit.key)?.value ?? usage.limit;
    const extraAllowance = Math.max(0, usage.limit - currentPlanLimit);
    const allowed = targetLimit.value + extraAllowance;

    if (usage.used > allowed) {
      violations.push({ limitKey: targetLimit.key, displayName: targetLimit.displayName, limit: allowed, used: usage.used });
    }
  }

  return violations;
}
