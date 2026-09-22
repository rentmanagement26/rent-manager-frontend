export default function SiteFooter() {
  return (
    <footer className="border-t border-default bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-center py-4 text-sm text-muted">
        <p>&copy; {new Date().getFullYear()} DomusPRO. All rights reserved.</p>
      </div>
    </footer>
  );
}