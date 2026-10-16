import { HouseLoader } from "@/components/house-loader";

// Shown inside the console layout while a page's data is loading (Next.js uses this file automatically).
export default function ConsoleLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <HouseLoader size={110} />
    </div>
  );
}
