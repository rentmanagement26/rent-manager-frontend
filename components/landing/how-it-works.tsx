// "How it works": three numbered steps from a first property to a signed lease.
const STEPS = [
  { title: "Add your property", text: "Create a property and its units, with photos and rent." },
  { title: "Invite your tenant", text: "One email invite. They join their own portal." },
  { title: "Sign the lease online", text: "Upload the lease, sign first, send it. Tenants read and sign on any device." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-8">
      <div className="mx-auto mb-7 max-w-xl text-center">
        <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">How it works</span>
        <h2 className="mt-1.5 font-head text-2xl font-extrabold leading-tight tracking-tight text-heading sm:text-[28px]">From first property to signed lease in three steps</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title} className="rounded-[20px] border border-subtle bg-white p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-tint text-xs font-extrabold text-accent">{index + 1}</span>
            <h3 className="mt-3 font-head text-base font-extrabold text-heading">{step.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
