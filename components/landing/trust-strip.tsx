// The thin row of reassurances under the hero: made in Canada, privacy, provincial lease rules, and approval-first AI.
import { Icon } from "@/components/pricing/icons";
import type { IconName } from "@/components/pricing/icons";

const ITEMS: { icon: IconName; text: string }[] = [
  { icon: "flag", text: "Made in Canada" },
  { icon: "lock", text: "Privacy-first by design" },
  { icon: "fileCheck", text: "Ontario and Manitoba lease rules built in" },
  { icon: "userCheck", text: "You approve everything the AI drafts" },
];

export function TrustStrip() {
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 border-y border-subtle bg-white px-6 py-4 text-[12.5px] font-semibold text-body">
      {ITEMS.map((item) => (
        <span key={item.text} className="flex items-center gap-2">
          <Icon name={item.icon} className="h-4 w-4 text-brand-green" />
          {item.text}
        </span>
      ))}
    </div>
  );
}
