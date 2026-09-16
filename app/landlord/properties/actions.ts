"use server";

import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { CreatePropertyInput, CreateUnitInput, UpdateUnitInput } from "@/lib/types";
import {
  getPropertyMediaUploadUrl,
  registerPropertyMedia,
  setPropertyMediaCover,
  deletePropertyMedia,
  getUnitMediaUploadUrl,
  registerUnitMedia,
} from "@/lib/media-api";

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

  const response = await backendFetch("/api/v1/properties", session.backendToken, {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  redirect("/landlord/properties");
}

export async function updatePropertyAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const propertyId = Number(formData.get("propertyId") ?? 0);

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

  const response = await backendFetch(`/api/v1/properties/${propertyId}`, session.backendToken, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    redirect(`/landlord/properties/${propertyId}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect(`/landlord/properties/${propertyId}`);
}

export async function archivePropertyAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const propertyId = Number(formData.get("propertyId") ?? 0);

  const response = await backendFetch(`/api/v1/properties/${propertyId}/archive`, session.backendToken, {
    method: "POST",
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    redirect(`/landlord/properties/${propertyId}?error=${encodeURIComponent(message)}`);
  }

  redirect("/landlord/properties?archived=1");
}

export async function getPropertyUploadUrlAction(propertyId: number, fileExtension: string) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  return getPropertyMediaUploadUrl(propertyId, fileExtension, session.backendToken);
}

export async function registerPropertyMediaAction(propertyId: number, blobPath: string, sortOrder: number) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  return registerPropertyMedia(propertyId, blobPath, sortOrder, session.backendToken);
}

export async function setPropertyCoverAction(propertyId: number, mediaId: number) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  await setPropertyMediaCover(propertyId, mediaId, session.backendToken);
}

export async function deletePropertyMediaAction(propertyId: number, mediaId: number) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  await deletePropertyMedia(propertyId, mediaId, session.backendToken);
}




export async function createUnitAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  const propertyId = Number(formData.get("propertyId") ?? 0);
  const input: CreateUnitInput = {
    unitTypeId: Number(formData.get("unitTypeId") ?? 0),
    label: String(formData.get("label") ?? ""),
    bedrooms: Number(formData.get("bedrooms") ?? 0),
    bathrooms: Number(formData.get("bathrooms") ?? 0),
    squareFeet: Number(formData.get("squareFeet") ?? 0),
    askingRent: Number(formData.get("askingRent") ?? 0),
  };

  const response = await backendFetch(`/api/v1/properties/${propertyId}/units`, session.backendToken, {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  redirect(`/landlord/properties/${propertyId}`);
}

export async function updateUnitAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const propertyId = Number(formData.get("propertyId") ?? 0);
  const unitId = Number(formData.get("unitId") ?? 0);

  const input: UpdateUnitInput = {
    unitTypeId: Number(formData.get("unitTypeId") ?? 0),
    label: String(formData.get("label") ?? ""),
    bedrooms: Number(formData.get("bedrooms") ?? 0),
    bathrooms: Number(formData.get("bathrooms") ?? 0),
    squareFeet: Number(formData.get("squareFeet") ?? 0),
    askingRent: Number(formData.get("askingRent") ?? 0),
    status: String(formData.get("status") ?? ""),
  };

  const response = await backendFetch(`/api/v1/properties/units/${unitId}`, session.backendToken, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    redirect(`/landlord/properties/${propertyId}/units/${unitId}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect(`/landlord/properties/${propertyId}/units/${unitId}`);
}

export async function archiveUnitAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const propertyId = Number(formData.get("propertyId") ?? 0);
  const unitId = Number(formData.get("unitId") ?? 0);

  const response = await backendFetch(`/api/v1/properties/units/${unitId}/archive`, session.backendToken, {
    method: "POST",
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    redirect(`/landlord/properties/${propertyId}/units/${unitId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/landlord/properties/${propertyId}?unitArchived=1`);
}

export async function getUnitUploadUrlAction(unitId: number, fileExtension: string) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  return getUnitMediaUploadUrl(unitId, fileExtension, session.backendToken);
}

export async function registerUnitMediaAction(unitId: number, blobPath: string, sortOrder: number) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  return registerUnitMedia(unitId, blobPath, sortOrder, session.backendToken);
}