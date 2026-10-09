import Image from "next/image";
import { logoutAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth-guard";

// Every page under this layout needs a signed-in admin. The full console shell (sidebar, header,
// dark mode) comes next; this is the minimal frame so sign-in has somewhere to land.
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-surface px-7 py-3">
        <Image src="/domuspro-logo.png" alt="DomusPRO" width={120} height={40} priority className="h-auto w-30" />
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right leading-tight">
            <div className="font-medium">{session.fullName}</div>
            <div className="text-xs text-ink-3">{session.role}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="h-9.5 rounded-[10px] border border-line-2 px-4 text-[13px] transition hover:bg-surface-2 active:scale-[0.97]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="p-7">{children}</div>
    </div>
  );
}
