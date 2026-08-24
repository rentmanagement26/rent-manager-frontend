export default function SiteFooter() {
  return (
    <footer className="border-t border-default bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 p-8 text-sm text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
        </svg>
        <p>&copy; {new Date().getFullYear()} Rent Manager. All rights reserved.</p>
      </div>
    </footer>
  );
}