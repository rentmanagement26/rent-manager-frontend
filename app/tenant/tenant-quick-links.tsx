// Shortcut card on the tenant home: the pages a tenant uses besides their home details.
import Link from "next/link";

const LINKS = [
  { href: "/tenant/notifications", label: "Notifications", note: "Messages from your landlord and DomusPRO" },
  { href: "/tenant/profile", label: "My profile", note: "Your name and password" },
  { href: "/tenant/settings", label: "Security settings", note: "Two-factor authentication" },
];

export function TenantQuickLinks() {
  return (
    <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-heading">Quick links</h2>
      <ul className="divide-y divide-default">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="-mx-2 flex items-center justify-between rounded-lg px-2 py-3 hover:bg-subtle">
              <span>
                <span className="block text-sm font-medium text-heading">{link.label}</span>
                <span className="block text-xs text-muted">{link.note}</span>
              </span>
              <span className="text-muted" aria-hidden="true">&rsaquo;</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
