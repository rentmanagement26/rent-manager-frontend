// Small shared pieces of the sign-in forms (class names kept in one place).
export const inputClass =
  "h-11.5 w-full rounded-xl border border-line-2 bg-bg px-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:border-brand focus:bg-surface focus:ring-3 focus:ring-brand-tint";

export const primaryButtonClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-medium text-brand-on transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60";

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-[10px] bg-alert-bg px-3 py-2.5 text-[13px] text-alert-text">
      {message}
    </p>
  );
}
