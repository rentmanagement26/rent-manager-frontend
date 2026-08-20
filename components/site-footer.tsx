export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl p-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Rent Manager. All rights reserved.</p>
      </div>
    </footer>
  );
}