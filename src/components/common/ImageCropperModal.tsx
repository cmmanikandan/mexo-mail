import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react';

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;  // data URL of raw selected image
  onClose: () => void;
  onCrop: (blob: Blob) => void;  // called with cropped 512×512 blob
}

const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/** Draw image on canvas respecting EXIF orientation embedded in the JPEG */
async function correctOrientation(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = dataUrl;
  });
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);   // 0 | 90 | 180 | 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });  // pan offset in pixels (crop-area space)
  const [isSaving, setIsSaving] = useState(false);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);

  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  // ─── Load image ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setIsSaving(false);
    correctOrientation(imageSrc).then(setLoadedImg);
  }, [isOpen, imageSrc]);

  // ─── Render canvas ────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const el = cropAreaRef.current;
    if (!canvas || !el || !loadedImg) return;

    const cw = el.clientWidth;
    const ch = el.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);

    const cx = cw / 2 + offset.x;
    const cy = ch / 2 + offset.y;
    const circleR = Math.min(cw, ch) * 0.42;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);

    // Determine natural dimensions vs rotated
    const isRotated90 = rotation === 90 || rotation === 270;
    const natW = isRotated90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
    const natH = isRotated90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;

    // Scale to fit the circle fully at zoom=1
    const baseScale = (circleR * 2) / Math.min(natW, natH);
    const scale = baseScale * zoom;

    const dw = natW * scale;
    const dh = natH * scale;

    ctx.drawImage(loadedImg, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    // Dark overlay outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.72)';
    ctx.fillRect(0, 0, cw, ch);
    // Clip out the circle (punch hole)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cw / 2, ch / 2, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cw / 2, ch / 2, circleR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [loadedImg, zoom, rotation, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on window resize
  useEffect(() => {
    const handler = () => draw();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [draw]);

  // ─── Clamp offset to prevent empty gaps inside the circle ─────────────────
  const clampOffset = useCallback(
    (ox: number, oy: number, currentZoom: number, currentRotation: number): { x: number; y: number } => {
      const el = cropAreaRef.current;
      if (!el || !loadedImg) return { x: ox, y: oy };
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const circleR = Math.min(cw, ch) * 0.42;
      const isRotated90 = currentRotation === 90 || currentRotation === 270;
      const natW = isRotated90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
      const natH = isRotated90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;
      const baseScale = (circleR * 2) / Math.min(natW, natH);
      const scale = baseScale * currentZoom;
      const dw = natW * scale;
      const dh = natH * scale;
      const maxX = Math.max(0, (dw - circleR * 2) / 2);
      const maxY = Math.max(0, (dh - circleR * 2) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, ox)),
        y: Math.min(maxY, Math.max(-maxY, oy)),
      };
    },
    [loadedImg]
  );

  // ─── Pointer events (mouse + touch unified) ───────────────────────────────
  const getPointer = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dragging.current = true;
    const pt = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0] : e.nativeEvent as MouseEvent;
    lastPointer.current = { x: (pt as Touch).clientX ?? (pt as MouseEvent).clientX, y: (pt as Touch).clientY ?? (pt as MouseEvent).clientY };
  };

  const onPointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      e.preventDefault();

      // Pinch zoom
      if ('touches' in e && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (lastPinchDist.current !== null) {
          const delta = dist / lastPinchDist.current;
          setZoom((z) => {
            const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta));
            return next;
          });
        }
        lastPinchDist.current = dist;
        return;
      }
      lastPinchDist.current = null;

      const pt = getPointer(e);
      const dx = pt.x - lastPointer.current.x;
      const dy = pt.y - lastPointer.current.y;
      lastPointer.current = pt;
      setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, zoom, rotation));
    },
    [clampOffset, zoom, rotation]
  );

  const onPointerUp = () => {
    dragging.current = false;
    lastPinchDist.current = null;
  };

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [isOpen, onPointerMove]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // ─── Zoom change → clamp offset ──────────────────────────────────────────
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    setZoom(clamped);
    setOffset((prev) => clampOffset(prev.x, prev.y, clamped, rotation));
  };

  // ─── Rotation ─────────────────────────────────────────────────────────────
  const rotate = (dir: 1 | -1) => {
    setRotation((r) => {
      const next = ((r + dir * 90) + 360) % 360;
      setOffset({ x: 0, y: 0 });  // reset pan on rotation
      return next;
    });
  };

  // ─── Crop output ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!loadedImg || isSaving) return;
    setIsSaving(true);

    try {
      const el = cropAreaRef.current!;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const circleR = Math.min(cw, ch) * 0.42;
      const cx = cw / 2 + offset.x;
      const cy = ch / 2 + offset.y;

      const out = document.createElement('canvas');
      out.width = OUTPUT_SIZE;
      out.height = OUTPUT_SIZE;
      const ctx = out.getContext('2d')!;

      // White background (handles transparent PNG correctly)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Scale from crop-area coords to output coords
      const scaleToOutput = OUTPUT_SIZE / (circleR * 2);

      const isRotated90 = rotation === 90 || rotation === 270;
      const natW = isRotated90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
      const natH = isRotated90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;
      const baseScale = (circleR * 2) / Math.min(natW, natH);
      const scale = baseScale * zoom * scaleToOutput;

      const dw = natW * scale;
      const dh = natH * scale;

      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(loadedImg, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      out.toBlob(
        (blob) => {
          if (blob) onCrop(blob);
          setIsSaving(false);
        },
        'image/webp',
        0.92
      );
    } catch (err) {
      console.error('Crop failed:', err);
      setIsSaving(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  const isMobile = window.innerWidth < 640;

  const cropperContent = (
    <div
      className={`fixed inset-0 z-[200] flex flex-col bg-slate-950 ${isMobile ? '' : 'items-center justify-center'}`}
      style={{ touchAction: 'none' }}
    >
      {/* Desktop: dark backdrop click-to-close */}
      {!isMobile && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        className={`relative flex flex-col bg-slate-950 ${
          isMobile
            ? 'w-full h-full'
            : 'w-full max-w-[580px] max-h-[92dvh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 mx-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          {isMobile ? (
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white transition-colors"
              aria-label="Cancel crop"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}
          <h3 className="text-sm font-extrabold text-white tracking-tight">Crop profile photo</h3>
          {!isMobile ? (
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-white transition-colors"
              aria-label="Close crop editor"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Canvas crop area */}
        <div
          ref={cropAreaRef}
          className="relative flex-1 min-h-0 overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none', touchAction: 'none', minHeight: isMobile ? 0 : 320 }}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ display: 'block' }}
            aria-label="Image crop area — drag to reposition"
          />
          {/* "This is how your photo will appear" hint */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-slate-950/70 text-white text-[10px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
              Drag to reposition · Scroll or pinch to zoom
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 px-5 py-4 bg-slate-950 border-t border-slate-800 space-y-4">
          {/* Zoom slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Zoom</span>
              <span className="font-mono text-indigo-400">{zoom.toFixed(1)}×</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.1)}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer"
                aria-label="Zoom level"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.1)}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rotate + action buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Rotate buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => rotate(-1)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
                aria-label="Rotate 90° counter-clockwise"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Rotate</span>
              </button>
              <button
                type="button"
                onClick={() => rotate(1)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
                aria-label="Rotate 90° clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Cancel + Save */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white text-xs font-extrabold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                aria-label="Save profile photo"
              >
                {isSaving ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Cropping...' : 'Save photo'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(cropperContent, document.body);
};
