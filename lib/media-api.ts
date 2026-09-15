import { backendFetch } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { MediaItem } from "@/lib/types";

export async function getPropertyMedia(propertyId: number, token: string): Promise<MediaItem[]> {
  const response = await backendFetch(`/api/v1/properties/${propertyId}/media`, token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function getPropertyMediaUploadUrl(
  propertyId: number,
  fileExtension: string,
  token: string
): Promise<{ blobPath: string; uploadUrl: string }> {
  const response = await backendFetch(`/api/v1/properties/${propertyId}/media/upload-url`, token, {
    method: "POST",
    body: JSON.stringify({ fileExtension }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function registerPropertyMedia(
  propertyId: number,
  blobPath: string,
  sortOrder: number,
  token: string
): Promise<{ mediaId: number }> {
  const response = await backendFetch(`/api/v1/properties/${propertyId}/media`, token, {
    method: "POST",
    body: JSON.stringify({ blobPath, sortOrder }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function setPropertyMediaCover(propertyId: number, mediaId: number, token: string): Promise<void> {
  const response = await backendFetch(`/api/v1/properties/${propertyId}/media/${mediaId}/cover`, token, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function deletePropertyMedia(propertyId: number, mediaId: number, token: string): Promise<void> {
  const response = await backendFetch(`/api/v1/properties/${propertyId}/media/delete`, token, {
    method: "POST",
    body: JSON.stringify({ mediaIds: [mediaId] }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function getUnitMedia(unitId: number, token: string): Promise<MediaItem[]> {
  const response = await backendFetch(`/api/v1/properties/units/${unitId}/media`, token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function getUnitMediaUploadUrl(
  unitId: number,
  fileExtension: string,
  token: string
): Promise<{ blobPath: string; uploadUrl: string }> {
  const response = await backendFetch(`/api/v1/properties/units/${unitId}/media/upload-url`, token, {
    method: "POST",
    body: JSON.stringify({ fileExtension }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function registerUnitMedia(
  unitId: number,
  blobPath: string,
  sortOrder: number,
  token: string
): Promise<{ mediaId: number }> {
  const response = await backendFetch(`/api/v1/properties/units/${unitId}/media`, token, {
    method: "POST",
    body: JSON.stringify({ blobPath, sortOrder }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}