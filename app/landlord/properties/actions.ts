"use server";

import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { CreatePropertyInput } from "@/lib/types";

export async function createPropertyAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  const line2 = String(formData.get("line2") ?? "").trim();
  const input: CreatePropertyInput = {
    name: String(formData.get("name") ?? ""),
    propertyTypeId: Number(formData.get("propertyTypeId") ?? 0),
    line1: String(formData.get("line1") ?? ""),
    line2: line2 === "" ? null : line2,
    city: String(formData.get("city") ?? ""),
    region: String(formData.get("region") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? "Canada"),
  };

  const response = await backendFetch("/api/properties", session.backendToken, {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  redirect("/landlord/properties");
}