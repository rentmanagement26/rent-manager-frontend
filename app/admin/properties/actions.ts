"use server";

import { redirect } from "next/navigation";
import { createProperty } from "@/lib/data/store";

export async function createPropertyAction(formData: FormData) {
  createProperty({
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    rentAmount: Number(formData.get("rentAmount") ?? 0),
  });

  redirect("/admin/properties");
}