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
    <div className="flex flex-1 flex-col md:flex-row">
      <nav className="flex flex-row gap-4 border-b border-gray-200 p-4 md:w-56 md:flex-col md:border-b-0 md:border-r">
        <Link href="/admin" className="font-medium">
          Dashboard
        </Link>
        <Link href="/admin/properties" className="font-medium">
          Properties
        </Link>
        <Link href="/admin/tenants" className="font-medium">
          Tenants
        </Link>
        <form action={logoutAction} className="md:mt-auto">
          <button type="submit" className="text-sm text-gray-500 hover:text-black">
            Sign out
          </button>
        </form>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}