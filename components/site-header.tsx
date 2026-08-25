import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-default bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="DomusPRO" width={160} height={28} className="h-auto" />
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-body hover:text-heading">
            Features
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}