"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";

const VIEWPORT_W = 240;
const VIEWPORT_H = 320; // 3:4 portrait
const OUTPUT_W = 480;
const OUTPUT_H = 640;

export default function PortraitCropper({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.max(VIEWPORT_W / w, VIEWPORT_H / h);
    setNatural({ w, h });
    setBaseScale(scale);
    setZoom(1);
    const dispW = w * scale;
    const dispH = h * scale;
    setPos({ x: (VIEWPORT_W - dispW) / 2, y: (VIEWPORT_H - dispH) / 2 });
  }

  function clampPos(x: number, y: number, dispW: number, dispH: number) {
    const minX = Math.min(0, VIEWPORT_W - dispW);
    const minY = Math.min(0, VIEWPORT_H - dispH);
    return {
      x: Math.max(minX, Math.min(0, x)),
      y: Math.max(minY, Math.min(0, y)),
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !natural) return;
    const dispW = natural.w * baseScale * zoom;
    const dispH = natural.h * baseScale * zoom;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const next = clampPos(dragRef.current.origX + dx, dragRef.current.origY + dy, dispW, dispH);
    setPos(next);
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(newZoom: number) {
    if (!natural) return;
    const oldDispW = natural.w * baseScale * zoom;
    const oldDispH = natural.h * baseScale * zoom;
    const newDispW = natural.w * baseScale * newZoom;
    const newDispH = natural.h * baseScale * newZoom;
    // Keep the viewport's center point stable while zooming
    const cx = VIEWPORT_W / 2;
    const cy = VIEWPORT_H / 2;
    const relX = (cx - pos.x) / oldDispW;
    const relY = (cy - pos.y) / oldDispH;
    const newX = cx - relX * newDispW;
    const newY = cy - relY * newDispH;
    setZoom(newZoom);
    setPos(clampPos(newX, newY, newDispW, newDispH));
  }

  function handleConfirm() {
    if (!natural || !imgRef.current) return;
    const displayScale = baseScale * zoom;
    const sourceX = -pos.x / displayScale;
    const sourceY = -pos.y / displayScale;
    const sourceW = VIEWPORT_W / displayScale;
    const sourceH = VIEWPORT_H / displayScale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, sourceX, sourceY, sourceW, sourceH, 0, 0, OUTPUT_W, OUTPUT_H);
    canvas.toBlob(
      (blob) => {
        if (blob) onCropped(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  const dispW = natural ? natural.w * baseScale * zoom : 0;
  const dispH = natural ? natural.h * baseScale * zoom : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100">
        <h3 className="font-bold text-sm text-slate-900 mb-1">Adjust Photo</h3>
        <p className="text-xs text-slate-500 mb-3">
          Drag to reposition, use the slider to zoom. This crop is what shows on the Team page card.
        </p>

        <div
          className="relative mx-auto overflow-hidden rounded-2xl border-2 border-brandblue bg-slate-100 touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ width: VIEWPORT_W, height: VIEWPORT_H }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {imgUrl && (
            <img
              ref={imgRef}
              src={imgUrl}
              onLoad={handleImgLoad}
              draggable={false}
              alt="Crop preview"
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: dispW,
                height: dispH,
                maxWidth: "none",
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 mb-4">
          <ZoomOut size={14} className="text-slate-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <ZoomIn size={14} className="text-slate-400 shrink-0" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!natural}
            className="flex-1 bg-brandblue hover:bg-brandblueDark text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check size={14} />
            Use This Crop
          </button>
        </div>
      </div>
    </div>
  );
}