// The dark call-to-action banner at the bottom of the landing page.
import Link from "next/link";

export function ClosingBanner() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-8">
      <div className="relative overflow-hidden rounded-[26px] bg-heading px-6 py-10 text-center sm:py-14">
        <div className="pointer-events-none absolute -right-14 -top-14 h-[200px] w-[200px] rounded-full border border-white/10" />
        <h2 className="relative font-head text-2xl font-extrabold text-white sm:text-4xl">Ready to run your rentals the calm way?</h2>
        <p className="relative mx-auto mt-3 max-w-md text-sm text-[#b9d0c9]">Set up your first property in minutes. No card needed.</p>
        <Link href="/register" className="relative mt-5 inline-block rounded-[14px] bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-accent-dark">
          Get started with DomusPRO
        </Link>
      </div>
    </section>
  );
}
