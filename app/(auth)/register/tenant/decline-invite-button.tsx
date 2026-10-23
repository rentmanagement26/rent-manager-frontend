// "No thanks" button on the tenant invite page: declines the invite without needing an account.
import { declineTenantInviteAction } from "./actions";

export function DeclineInviteButton({ token }: { token: string }) {
  return (
    <form action={declineTenantInviteAction} className="mt-5 text-center">
      <input type="hidden" name="token" value={token} />
      <button type="submit" className="text-sm text-muted underline hover:text-heading">
        Decline this invite
      </button>
    </form>
  );
}
