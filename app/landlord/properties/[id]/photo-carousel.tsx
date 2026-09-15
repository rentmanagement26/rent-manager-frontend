"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { MediaItem } from "@/lib/types";
import {
  getPropertyUploadUrlAction,
  registerPropertyMediaAction,
  setPropertyCoverAction,
  deletePropertyMediaAction,
} from "../actions";

const MAX_PHOTOS = 5; // mirrors the backend's MaxPhotosPerProperty
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function PhotoCarousel({ propertyId, photos }: { propertyId: number; photos: MediaItem[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cover-first ordering, independent of sortOrder — matches the mobile app's behavior.
  const ordered = [...photos].sort((a, b) => {
    if (a.isCover) return -1;
    if (b.isCover) return 1;
    return a.sortOrder - b.sortOrder;
  });
  const active = ordered[Math.min(activeIndex, ordered.length - 1)];

  async function uploadOneFile(file: File, sortOrder: number) {
    const fileExtension = EXTENSION_BY_MIME_TYPE[file.type] ?? ".jpg";
    const { blobPath, uploadUrl } = await getPropertyUploadUrlAction(propertyId, fileExtension);

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

    await registerPropertyMediaAction(propertyId, blobPath, sortOrder);
  }

  async function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file later
    if (files.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    const toUpload = files.slice(0, room);

    setUploading(true);
    setError(null);
    try {
      // Sequential, not Promise.all — sortOrder is derived from the current photo
      // count, and the backend checks that count on each insert, so parallel
      // uploads could race past the per-property limit.
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

  async function handleSetCover(mediaId: number) {
    setError(null);
    try {
      await setPropertyCoverAction(propertyId, mediaId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set cover photo.");
    }
  }

  async function handleDelete(mediaId: number) {
    setError(null);
    try {
      await deletePropertyMediaAction(propertyId, mediaId);
      setActiveIndex(0);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete photo.");
    }
  }

  return (
    <div>
      <div className="relative aspect-video w-full rounded-2xl bg-subtle overflow-hidden">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element -- SAS URLs are unique/expiring; next/image's optimizer would need Azure's storage host allowlisted and would just re-cache a URL that's dead in 10 minutes.
          <img src={active.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            No photos yet
          </div>
        )}
        {ordered.length > 0 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 text-white text-xs px-2.5 py-1">
            {photos.length}/{MAX_PHOTOS}
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {ordered.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setActiveIndex(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- see note above */}
            <img
              src={photo.url}
              alt=""
              className={`w-full h-full object-cover ${index === activeIndex ? "ring-2 ring-accent" : ""}`}
            />
            {photo.isCover && (
              <span className="absolute top-1 left-1 text-xs" title="Cover photo">
                ⭐
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end gap-1 p-1 opacity-0 group-hover:opacity-100">
              {!photo.isCover && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetCover(photo.id);
                  }}
                  className="w-6 h-6 rounded-full bg-white/90 text-xs flex items-center justify-center"
                  title="Set as cover"
                >
                  ⭐
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo.id);
                }}
                className="w-6 h-6 rounded-full bg-white/90 text-xs flex items-center justify-center"
                title="Delete photo"
              >
                🗑
              </button>
            </div>
          </div>
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