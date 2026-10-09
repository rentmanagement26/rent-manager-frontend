export function TenantPageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-head text-2xl font-bold text-heading">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
