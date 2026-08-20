import Link from "next/link";

const features = [
  {
    title: "Property & unit management",
    description: "Track every property, unit, and occupancy status in one place.",
  },
  {
    title: "Tenant portal",
    description: "Tenants view their lease, rent history, and submit requests online.",
  },
  {
    title: "Digital leases",
    description: "Send, sign, and store leases digitally — no more paperwork.",
  },
  {
    title: "Online rent payments",
    description: "Collect rent online and keep a complete, automatic payment history.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-4 px-8 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
          Manage your rentals without the chaos.
        </h1>
        <p className="max-w-xl text-lg text-gray-600">
          Rent Manager brings properties, tenants, leases, and payments
          together in one simple platform — for landlords and tenants alike.
        </p>
        <Link
          href="/login"
          className="mt-4 rounded bg-black px-6 py-3 text-white"
        >
          Get started
        </Link>
      </section>

      <section id="features" className="border-t border-gray-200 bg-gray-50 px-8 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded border border-gray-200 bg-white p-6"
            >
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}