"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { MediaItem } from "@/lib/types";
import { getUnitUploadUrlAction, registerUnitMediaAction } from "../../../actions";

const MAX_PHOTOS = 10; // mirrors the backend's MaxPhotosPerUnit
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function PhotoStrip({ unitId, photos }: { unitId: number; photos: MediaItem[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const ordered = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);

  async function uploadOneFile(file: File, sortOrder: number) {
    const fileExtension = EXTENSION_BY_MIME_TYPE[file.type] ?? ".jpg";
    const { blobPath, uploadUrl } = await getUnitUploadUrlAction(unitId, fileExtension);

    const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    });
    if (!putResponse.ok) {
      throw new Error("Photo upload failed. Please try again.");
    }

    await registerUnitMediaAction(unitId, blobPath, sortOrder);
  }

  async function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    const toUpload = files.slice(0, room);

    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < toUpload.length; i++) {
        await uploadOneFile(toUpload[i], photos.length + i);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted">Photos</p>
        <span className="text-xs text-muted">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ordered.map((photo, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- SAS URLs are unique/expiring, see photo-carousel.tsx
          <img
            key={photo.id}
            src={photo.url}
            alt=""
            onClick={() => setLightboxIndex(index)}
            className="shrink-0 w-20 h-20 rounded-lg object-cover cursor-pointer"
          />
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= MAX_PHOTOS}
          className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-default flex items-center justify-center text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-default disabled:hover:text-muted"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-2xl leading-none">+</span>
          )}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted">Photos can&apos;t be removed without admin help.</p>

      {lightboxIndex !== null && ordered[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
          >
            ✕
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              ‹
            </button>
          )}
          {lightboxIndex < ordered.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              ›
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element -- see note above */}
          <img
            src={ordered[lightboxIndex].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />

          <span className="absolute bottom-4 text-white text-sm">
            {lightboxIndex + 1} / {ordered.length}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />
    </div>
  );
}