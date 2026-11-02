// The feature grid: leases and signing, renewals, the tenant portal, the approval-first AI assistant, and rent (coming soon).
// Only features that exist today, or are clearly marked "Coming soon".
import { Icon } from "@/components/pricing/icons";
import type { IconName } from "@/components/pricing/icons";

function IconBadge({ icon, tone }: { icon: IconName; tone: "orange" | "green" | "solid" }) {
  const style = tone === "solid" ? "bg-accent text-white" : tone === "orange" ? "bg-accent-tint text-accent" : "bg-brand-green-tint text-brand-green";
  return (
    <span className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] ${style}`}>
      <Icon name={icon} className="h-[18px] w-[18px]" />
    </span>
  );
}

const card = "flex flex-col gap-2 rounded-[22px] border border-subtle bg-white p-5";

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-14 sm:px-8">
      <div className="mx-auto mb-7 max-w-xl text-center">
        <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">Everything in one place</span>
        <h2 className="mt-1.5 font-head text-2xl font-extrabold leading-tight tracking-tight text-heading sm:text-[28px]">The tools a landlord actually needs</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${card} md:col-span-2`}>
          <IconBadge icon="file" tone="orange" />
          <h3 className="font-head text-base font-extrabold text-heading">Digital leases and signing</h3>
          <p className="text-[13px] leading-relaxed text-muted">Prepare, sign and send leases. Draw or type your signature, or sign on paper and upload the scan. Every step is recorded.</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {["Online signing", "Paper option", "Full history"].map((label) => (
              <span key={label} className="rounded-full bg-brand-green-tint px-2.5 py-1 text-[11.5px] font-bold text-brand-green-dark">{label}</span>
            ))}
          </div>
        </div>

        <div className={card}>
          <IconBadge icon="calendar" tone="green" />
          <h3 className="font-head text-base font-extrabold text-heading">Renewals that never slip</h3>
          <p className="text-[13px] leading-relaxed text-muted">See every lease ending soon, with the notice date and reminders.</p>
        </div>

        <div className={card}>
          <IconBadge icon="users" tone="green" />
          <h3 className="font-head text-base font-extrabold text-heading">A portal for tenants</h3>
          <p className="text-[13px] leading-relaxed text-muted">Leases, documents and requests in one place for your tenants.</p>
        </div>

        <div className="flex flex-col gap-2 rounded-[22px] border border-heading bg-heading p-5 md:col-span-2">
          <IconBadge icon="sparkles" tone="solid" />
          <h3 className="font-head text-base font-extrabold text-white">An AI assistant that asks first</h3>
          <p className="text-[13px] leading-relaxed text-[#b9d0c9]">It drafts reminders, summaries and replies. Nothing is sent, charged or changed until you approve it.</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
            <span className="rounded-full bg-white/10 px-3 py-1.5">AI prepares a draft</span>
            <span className="rounded-full bg-accent px-3 py-1.5">You approve</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">Logged</span>
          </div>
        </div>

        <div className={card}>
          <IconBadge icon="cash" tone="orange" />
          <h3 className="font-head text-base font-extrabold text-heading">
            Rent and expenses <span className="ml-1 rounded-full bg-accent-tint px-2 py-0.5 align-middle text-[10.5px] font-bold text-accent-dark">Coming soon</span>
          </h3>
          <p className="text-[13px] leading-relaxed text-muted">Online rent, expenses and a year-end export for taxes.</p>
        </div>
      </div>
    </section>
  );
}
