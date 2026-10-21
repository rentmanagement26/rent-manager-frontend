"use client";

// Choosing several landlords on the Landlords page: a provider that holds the choice, a checkbox per row, a select-all box
// for the page, and the bar that appears once something is chosen ("Propose plan to N"). The rows are drawn by the server
// page; only these small pieces are client code.
import { createContext, useContext, useState, type ReactNode } from "react";
import { BulkProposalModal } from "@/components/console/bulk-proposal-modal";
import { primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import type { AdminPackage } from "@/lib/types";

interface Person {
  id: number;
  name: string;
}

interface Selection {
  chosen: Map<number, string>;
  toggle: (person: Person) => void;
  setMany: (people: Person[], on: boolean) => void;
  clear: () => void;
}

const SelectionContext = createContext<Selection | null>(null);

function useSelection() {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("Selection components must sit inside BulkSelectionProvider.");
  return value;
}

export function BulkSelectionProvider({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState<Map<number, string>>(new Map());

  const value: Selection = {
    chosen,
    toggle: (person) =>
      setChosen((current) => {
        const next = new Map(current);
        if (next.has(person.id)) next.delete(person.id);
        else next.set(person.id, person.name);
        return next;
      }),
    setMany: (people, on) =>
      setChosen((current) => {
        const next = new Map(current);
        for (const person of people) {
          if (on) next.set(person.id, person.name);
          else next.delete(person.id);
        }
        return next;
      }),
    clear: () => setChosen(new Map()),
  };

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

const boxClass = "size-4 shrink-0 accent-c-ac";

// The checkbox at the start of one landlord row.
export function RowCheckbox({ id, name }: Person) {
  const selection = useSelection();
  return (
    <input
      type="checkbox"
      aria-label={`Select ${name}`}
      checked={selection.chosen.has(id)}
      onChange={() => selection.toggle({ id, name })}
      className={boxClass}
    />
  );
}

// The box in the column header: selects or clears every landlord on this page.
export function SelectAllCheckbox({ people }: { people: Person[] }) {
  const selection = useSelection();
  const all = people.length > 0 && people.every((p) => selection.chosen.has(p.id));
  return (
    <input
      type="checkbox"
      aria-label="Select everyone on this page"
      checked={all}
      onChange={() => selection.setMany(people, !all)}
      className={boxClass}
    />
  );
}

// Appears while something is chosen: how many, "Propose plan to N", and Clear.
export function BulkBar({ packages }: { packages: AdminPackage[] }) {
  const selection = useSelection();
  const [open, setOpen] = useState(false);

  if (selection.chosen.size === 0) return null;
  const count = selection.chosen.size;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-c-aci px-4 py-2.5 text-[13px] text-c-act2">
        <span>
          <b>{count} selected</b> on this page
        </span>
        <span className="flex gap-2">
          <button type="button" onClick={() => setOpen(true)} className={`${primaryButtonClass} h-9`}>
            Propose plan to {count}
          </button>
          <button type="button" onClick={selection.clear} className={`${secondaryButtonClass} h-9`}>
            Clear
          </button>
        </span>
      </div>

      {open && (
        <BulkProposalModal
          packages={packages}
          people={Array.from(selection.chosen, ([id, name]) => ({ id, name }))}
          onClose={() => setOpen(false)}
          onSent={() => {
            setOpen(false);
            selection.clear();
          }}
        />
      )}
    </>
  );
}
