"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { updateProfileAction } from "@/lib/profile-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { UserProfile } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent";

export function NameRow({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setSaving(true);
    setError("");
    const result = await updateProfileAction(
      String(form.get("firstName") ?? ""),
      String(form.get("middleName") ?? ""),
      String(form.get("lastName") ?? "")
    );
    setSaving(false);

    if ("error" in result) {
      if (result.expired) {
        goToSessionExpired();
      } else {
        setError(result.error);
      }
      return;
    }

    setEditing(false);
    setSaved(true);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4 border-t border-default py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-heading">Name</p>
          <p className="truncate text-sm text-muted">{profile.fullName}</p>
          {saved && <p className="mt-1 text-sm font-medium text-green-700">Name updated.</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setSaved(false);
            setEditing(true);
          }}
          className="shrink-0 rounded-lg border border-default px-3.5 py-2 text-sm font-semibold text-heading hover:bg-subtle"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-default py-4">
      <p className="text-sm font-medium text-heading">Edit name</p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-sm font-semibold text-body">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            defaultValue={profile.firstName}
            autoComplete="given-name"
            maxLength={100}
            required
            autoFocus
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-sm font-semibold text-body">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            defaultValue={profile.lastName}
            autoComplete="family-name"
            maxLength={100}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-[calc(50%-0.5rem)]">
        <label htmlFor="middleName" className="text-sm font-semibold text-body">
          Middle name <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="middleName"
          name="middleName"
          type="text"
          defaultValue={profile.middleName ?? ""}
          autoComplete="additional-name"
          maxLength={100}
          className={inputClass}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save name"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError("");
          }}
          className="rounded-lg border border-default px-4 py-2.5 text-sm font-semibold text-heading hover:bg-subtle"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
