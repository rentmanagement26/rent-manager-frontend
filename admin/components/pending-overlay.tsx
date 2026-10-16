"use client";

import { useFormStatus } from "react-dom";
import { HouseLoader } from "@/components/house-loader";

// Put this inside a <form action={...}>. While the form is being sent (for example a sign-in), it covers the
// page with the house loader, so people can see that something is happening and don't press the button twice.
export function PendingOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-[2px]">
      <HouseLoader size={110} />
    </div>
  );
}
