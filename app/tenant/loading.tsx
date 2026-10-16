import { HouseLoader } from "@/components/house-loader";

// Shown while a page in this area is loading (Next.js uses this file automatically).
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <HouseLoader size={110} />
    </div>
  );
}
