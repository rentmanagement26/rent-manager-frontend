"use server";

import { redirect } from "next/navigation";
import { createProperty } from "@/lib/data/store";

export async function createPropertyAction(formData: FormData) {
  const line2 = String(formData.get("line2") ?? "").trim();

  createProperty({
    name: String(formData.get("name") ?? ""),
    propertyTypeId: Number(formData.get("propertyTypeId") ?? 0),
    line1: String(formData.get("line1") ?? ""),
    line2: line2 === "" ? null : line2,
    city: String(formData.get("city") ?? ""),
    region: String(formData.get("region") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? "Canada"),
  });

  redirect("/landlord/properties");
}