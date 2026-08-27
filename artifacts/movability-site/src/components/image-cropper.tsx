import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Crop an image to the exact shape it will appear in on the site, with a live
 * preview, and save the result as a new image.
 *
 * The crop is "baked" into a new file rather than stored as settings: the
 * cropped version is uploaded like any other image, so nothing downstream —
 * the public pages, the API, the database — needs to know cropping happened.
 */

const OUTPUT_WIDTH = 1600;

type Props = {
  src: string;
  /** width ÷ height of the frame this image appears in on the site */
  aspect?: number;
  label?: string;
  onCancel: () => void;
  onApply: (file: File) => void | Promise<void>;
};

export default function ImageCropper({
  src,
  aspect = 1.75,
  label = "how it appears on the card",
  onCancel,
  onApply,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [frameW, setFrameW] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* Track the frame's rendered width so the maths below works in real pixels. */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setFrameW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const frameH = frameW / aspect;

  /* The image is scaled to cover the frame, then zoomed on top of that. */
  const baseScale = natural
    ? Math.max(frameW / natural.w, frameH / natural.h)
    : 1;
  const scale = baseScale * zoom;
  const drawnW = natural ? natural.w * scale : 0;
  const drawnH = natural ? natural.h * scale : 0;
  const maxX = Math.max(0, (drawnW - frameW) / 2);
  const maxY = Math.max(0, (drawnH - frameH) / 2);

  const clamp = useCallback(
    (o: { x: number; y: number }) => ({
      x: Math.min(maxX, Math.max(-maxX, o.x)),
      y: Math.min(maxY, Math.max(-maxY, o.y)),
    }),
    [maxX, maxY],
  );

  useEffect(() => setOffset((o) => clamp(o)), [zoom, frameW, natural, clamp]);

  function startDrag(e: React.PointerEvent) {
    if (maxX === 0 && maxY === 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDrag(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset(
      clamp({
        x: dragStart.current.ox + (e.clientX - dragStart.current.x),
        y: dragStart.current.oy + (e.clientY - dragStart.current.y),
      }),
    );
  }
  function endDrag() {
    setDragging(false);
  }

  async function handleApply() {
    const img = imgRef.current;
    if (!img || !natural) return;
    setBusy(true);
    setError("");
    try {
      // Convert on-screen framing into source-pixel coordinates.
      const srcW = frameW / scale;
      const srcH = frameH / scale;
      const srcX = (natural.w - srcW) / 2 - offset.x / scale;
      const srcY = (natural.h - srcH) / 2 - offset.y / scale;

      const outW = Math.min(OUTPUT_WIDTH, Math.round(srcW));
      const outH = Math.round(outW / aspect);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not prepare the image");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Could not save the cropped image");

      await onApply(new File([blob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cropping failed";
      // A cross-origin image (e.g. one still hosted on Framer) cannot be read
      // back out of the canvas by the browser, for security reasons.
      setError(
        message.includes("tainted") || message.toLowerCase().includes("secur")
          ? "This image is hosted on another site, so the browser won't let us crop it. Upload the picture as a file first, then crop."
          : message,
      );
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 my-8">
        <h2 className="text-base font-bold text-gray-900">Adjust the crop</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          Drag the picture to reposition it, and zoom to fill more of the frame. What
          you see is exactly {label}.
        </p>

        {/* editing frame */}
        <div
          ref={frameRef}
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`relative w-full overflow-hidden bg-gray-900 select-none ${
            maxX || maxY ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
          }`}
          style={{ aspectRatio: String(aspect) }}
        >
          <img
            ref={imgRef}
            src={src}
            crossOrigin="anonymous"
            alt=""
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            onError={() => setError("Could not load this image.")}
            className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
            style={{
              width: drawnW ? `${drawnW}px` : "auto",
              height: drawnH ? `${drawnH}px` : "auto",
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
          {/* thirds guides, to help line things up */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/50" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/50" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/50" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/50" />
          </div>
        </div>

        {/* zoom */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-gray-500 w-10">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-xs text-gray-400 w-12 text-right tabular-nums">
            {zoom.toFixed(2)}×
          </span>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1"
          >
            Reset
          </button>
        </div>

        {natural && (
          <p className="text-xs text-gray-400 mt-3">
            Source {natural.w}×{natural.h}px.
            {natural.w < 1200 && " Small source image — heavy zoom will look soft."}
          </p>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={busy || !natural}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save crop"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
