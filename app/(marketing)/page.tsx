import Link from "next/link";

const features = [
  {
    title: "Property & unit management",
    description: "Track every property, unit, and occupancy status in one place.",
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6" />
      </>
    ),
  },
  {
    title: "Tenant portal",
    description: "Tenants view their lease, rent history, and submit requests online.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M15.7 13.2A4.8 4.8 0 0 1 21 17.5" />
      </>
    ),
  },
  {
    title: "Digital leases",
    description: "Send, sign, and store leases digitally — no more paperwork.",
    icon: (
      <>
        <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v4h4" />
        <path d="M9 15c1.5 1.6 4.5 1.6 6 0" />
      </>
    ),
  },
  {
    title: "Online rent payments",
    description: "Collect rent online and keep a complete, automatic payment history.",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-8 sm:py-24">
        <span className="rounded-full bg-accent-tint px-3.5 py-1.5 text-xs font-semibold text-accent-dark">
          Built for landlords &amp; tenants
        </span>
        <h1 className="max-w-2xl font-head text-3xl font-extrabold tracking-tight text-heading sm:text-5xl">
          Manage your rentals without the chaos.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Rent Manager brings properties, tenants, leases, and payments
          together in one simple platform — for landlords and tenants alike.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
        >
          Get started
        </Link>
      </section>

      <section id="features" className="px-6 py-16 sm:px-8 sm:py-24">
        <h2 className="mb-10 text-center font-head text-2xl font-bold tracking-tight text-heading sm:text-3xl">
          Everything you need to run your rentals
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-2xl border border-subtle bg-surface p-6 shadow-sm sm:p-8"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-tint">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="font-head text-lg font-bold text-heading">{feature.title}</h3>
              <p className="text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}