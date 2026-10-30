"use client";

// A small canvas to draw a signature with a mouse, finger or pen. Reports the strokes (points on the canvas) to the parent,
// which sends them to the backend; the backend draws them onto the final signed PDF.
import { useEffect, useRef, useState } from "react";
import type { SignatureDrawing } from "@/lib/document-types";

const WIDTH = 480;
const HEIGHT = 140;

export function SignaturePad({ value, onChange }: { value: SignatureDrawing | null; onChange: (drawing: SignatureDrawing | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<{ x: number; y: number }[][]>(value?.strokes ?? []);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  // Paints every stroke so far (used when the pad first shows and after Clear).
  function repaint() {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#16302b";
    for (const stroke of strokes.current) {
      context.beginPath();
      stroke.forEach((point, index) => (index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y)));
      context.stroke();
    }
  }

  useEffect(repaint, []);

  // Pointer position in canvas units, whatever size the canvas is drawn at.
  function pointFrom(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.round(((event.clientX - rect.left) / rect.width) * WIDTH), y: Math.round(((event.clientY - rect.top) / rect.height) * HEIGHT) };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    strokes.current.push([pointFrom(event)]);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const current = strokes.current[strokes.current.length - 1];
    current.push(pointFrom(event));
    repaint();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    // A single tap is not a signature: keep only strokes with at least a few points.
    strokes.current = strokes.current.filter((stroke) => stroke.length > 2);
    setEmpty(strokes.current.length === 0);
    onChange(strokes.current.length > 0 ? { width: WIDTH, height: HEIGHT, strokes: strokes.current } : null);
  }

  function clear() {
    strokes.current = [];
    repaint();
    setEmpty(true);
    onChange(null);
  }

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          aria-label="Draw your signature here"
          className="h-[140px] w-full touch-none cursor-crosshair rounded-xl border border-dashed border-slate-400 bg-white"
        />
        {empty && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">Draw your signature here</span>}
      </div>
      <button type="button" onClick={clear} disabled={empty} className="mt-1.5 text-xs font-semibold text-accent hover:text-accent-dark disabled:text-muted">
        Clear
      </button>
    </div>
  );
}
