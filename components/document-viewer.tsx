"use client";

// In-page lease viewer: page thumbnails on the left, the open page in the middle, zoom and page controls on top.
// Opening a page reports it through onPageSeen, so "Read lease" can count pages viewed. The PDF is drawn with pdf.js from our own file route.
import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

const THUMB_WIDTH = 64;

export function DocumentViewer({
  fileUrl,
  downloadUrl,
  title,
  seenPages,
  onPageSeen,
}: {
  fileUrl: string;
  downloadUrl: string;
  title: string;
  // Pages already viewed (from the backend), shown with a tick.
  seenPages: ReadonlySet<number>;
  onPageSeen: (page: number) => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(onPageSeen);
  useEffect(() => {
    seenRef.current = onPageSeen;
  });

  // Load the PDF once. pdf.js is imported here (not at the top) because it only works in the browser.
  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        // The other party uploaded this file. pdf.js 6 only draws pages (it runs no PDF scripts and no eval), and it is kept
        // on a patched release because earlier 5.x versions could be made to run script by a crafted PDF.
        const loading = pdfjs.getDocument({ url: fileUrl });
        task = loading;
        const loaded = await loading.promise;
        if (!cancelled) setPdf(loaded);
      } catch {
        if (!cancelled) setError("Couldn't open the lease. Refresh the page, or download it instead.");
      }
    })();
    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [fileUrl]);

  // Draw the open page and count it as viewed once it is on screen.
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let cancelled = false;
    setRendering(true);
    (async () => {
      const pdfPage = await pdf.getPage(page);
      const viewport = pdfPage.getViewport({ scale: (zoom / 100) * 1.3 });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
      if (!cancelled) {
        setRendering(false);
        seenRef.current(page);
      }
    })().catch(() => {
      if (!cancelled) setError("Couldn't show this page. Try another page or download the lease.");
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, page, zoom]);

  const open = useCallback((next: number) => {
    setPage(next);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const total = pdf?.numPages ?? 0;
  const buttonClass = "flex h-8 w-8 items-center justify-center rounded-lg border border-default bg-white text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-2xl border border-default bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3 text-sm">
        <p className="font-semibold text-heading">
          {title} <span className="font-normal text-muted">· Page {page} of {total || "…"}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button type="button" className={buttonClass} aria-label="Zoom out" disabled={zoom <= 60} onClick={() => setZoom((z) => z - 20)}>−</button>
            <span className="w-11 text-center text-xs text-muted">{zoom}%</span>
            <button type="button" className={buttonClass} aria-label="Zoom in" disabled={zoom >= 160} onClick={() => setZoom((z) => z + 20)}>+</button>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" className={buttonClass} aria-label="Previous page" disabled={page <= 1} onClick={() => open(page - 1)}>‹</button>
            <button type="button" className={buttonClass} aria-label="Next page" disabled={page >= total} onClick={() => open(page + 1)}>›</button>
          </div>
          <a href={downloadUrl} className="rounded-full border border-default px-4 py-1.5 text-xs font-semibold text-heading hover:bg-subtle">
            Download PDF
          </a>
        </div>
      </div>

      {error ? (
        <p className="m-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>
      ) : (
        <div className="grid h-[70vh] min-h-[420px] grid-cols-[92px_minmax(0,1fr)]">
          <div className="space-y-3 overflow-y-auto border-r border-default bg-slate-50 p-2">
            {Array.from({ length: total }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => open(number)}
                aria-label={`Open page ${number}`}
                className="block w-full text-center text-[10px] text-muted outline-none"
              >
                <span
                  className={`relative mx-auto flex h-[84px] items-center justify-center rounded-md border-[1.5px] bg-white ${
                    number === page ? "border-accent ring-2 ring-accent-tint" : "border-default"
                  }`}
                  style={{ width: THUMB_WIDTH }}
                >
                  <span className="text-xs text-muted">{number}</span>
                  {seenPages.has(number) && number !== page && (
                    <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] text-white">✓</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex items-start justify-center overflow-auto bg-slate-200 p-4">
            {!pdf && <p className="mt-10 text-sm text-muted">Opening the lease…</p>}
            <canvas ref={canvasRef} className={`bg-white shadow-md ${pdf ? "" : "hidden"} ${rendering ? "opacity-60" : ""}`} />
          </div>
        </div>
      )}
    </div>
  );
}
