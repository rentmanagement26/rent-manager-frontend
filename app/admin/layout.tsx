import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { logoutAction } from "@/app/admin/actions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-bg md:flex-row">
      <nav className="flex flex-row items-center gap-2 border-b border-default bg-surface p-4 md:w-60 md:flex-shrink-0 md:flex-col md:items-stretch md:gap-1 md:border-b-0 md:border-r md:p-5">
        <Link href="/" className="mb-4 hidden items-center gap-2 md:flex">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l9-7 9 7" />
            <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
          </svg>
          <span className="font-head text-base font-bold text-heading">DomusPRO</span>
        </Link>

        <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-body hover:bg-subtle">
          Dashboard
        </Link>
        <Link href="/admin/properties" className="rounded-lg px-3 py-2 text-sm font-medium text-body hover:bg-subtle">
          Properties
        </Link>
        <Link href="/admin/tenants" className="rounded-lg px-3 py-2 text-sm font-medium text-body hover:bg-subtle">
          Tenants
        </Link>

        <form action={logoutAction} className="md:mt-auto">
          <button type="submit" className="rounded-lg px-3 py-2 text-sm text-muted hover:text-heading">
            Sign out
          </button>
        </form>
      </nav>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}