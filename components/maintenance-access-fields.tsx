"use client";

// The "Getting into your unit" fields of the report form: permission to enter, notes, best times, how to reach the tenant, pets.
// All optional. The parent owns the values.
import { ChoiceChips } from "@/components/choice-chips";
import { BEST_TIMES, CONTACT_METHODS, PERMISSIONS } from "@/lib/maintenance-format";
import type { AccessInput } from "@/lib/maintenance-types";

const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-heading";

export function AccessFields({ value, onChange }: { value: AccessInput; onChange: (next: AccessInput) => void }) {
  const set = (patch: Partial<AccessInput>) => onChange({ ...value, ...patch });
  const toggleTime = (time: string) =>
    set({ bestTimes: value.bestTimes.includes(time) ? value.bestTimes.filter((item) => item !== time) : [...value.bestTimes, time] });

  return (
    <div className="space-y-4">
      <div>
        <span className={labelClass}>Permission to enter</span>
        <ChoiceChips label="Permission to enter" options={PERMISSIONS} selected={[value.permissionToEnter]} onToggle={(item) => set({ permissionToEnter: item })} />
        {/* Landlords must give written notice before entering (24 hours in Ontario and Manitoba) except in an emergency, whatever is chosen here. */}
        <p className="mt-1.5 text-xs text-muted">This is only your preference. It does not replace the written notice your landlord must give before entering, except in an emergency.</p>
      </div>

      <div>
        <label htmlFor="access-notes" className={labelClass}>Access notes</label>
        <input
          id="access-notes"
          maxLength={300}
          value={value.accessNotes}
          onChange={(event) => set({ accessNotes: event.target.value })}
          placeholder="Buzzer 204. Please use the back entrance."
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Best times for a visit</span>
        <ChoiceChips label="Best times for a visit" options={BEST_TIMES} selected={value.bestTimes} onToggle={toggleTime} />
      </div>

      <div>
        <span className={labelClass}>How should we reach you?</span>
        <ChoiceChips
          label="How should we reach you"
          options={CONTACT_METHODS}
          selected={value.contactMethod ? [value.contactMethod] : []}
          onToggle={(item) => set({ contactMethod: value.contactMethod === item ? null : item })}
        />
        <input
          aria-label="Your phone number for this request"
          value={value.contactPhone}
          onChange={(event) => set({ contactPhone: event.target.value })}
          placeholder="(204) 555-0188"
          className={`${inputClass} mt-2 max-w-xs`}
        />
      </div>

      <div>
        <span className={labelClass}>Pets in the unit?</span>
        <ChoiceChips
          label="Pets in the unit"
          options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
          selected={value.hasPets === null ? [] : [value.hasPets ? "yes" : "no"]}
          onToggle={(item) => set({ hasPets: item === "yes" })}
        />
      </div>
    </div>
  );
}
