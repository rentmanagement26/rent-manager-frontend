import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="text-lg font-bold">
          Rent Manager
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="#features" className="text-sm text-gray-600 hover:text-black">
            Features
          </Link>
          <Link
            href="/login"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}