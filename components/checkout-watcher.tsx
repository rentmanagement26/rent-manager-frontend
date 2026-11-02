"use client";

// After Stripe sends the landlord back, the plan changes only when Stripe's webhook reaches the backend. This reloads the page
// every 3 seconds (up to 10 times) until the Stripe subscription shows up.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_TRIES = 10;

export function CheckoutWatcher({ waiting }: { waiting: boolean }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!waiting || tries >= MAX_TRIES) return;
    const timer = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [waiting, tries, router]);

  if (!waiting) return null;
  return (
    <div className="max-w-xl rounded-2xl border border-default bg-subtle p-4 text-sm text-body">
      {tries < MAX_TRIES ? "Confirming your payment with Stripe…" : "Your payment is still being confirmed. Refresh this page in a minute."}
    </div>
  );
}
