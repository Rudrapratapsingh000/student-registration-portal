import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Move } from 'lucide-react';

const ImageCropper = forwardRef(function ImageCropper(
  {
    imageSrc,
    onTransformChange,
  },
  ref
) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);
  const viewportRef = useRef(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    resetCrop() {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    },
    getCroppedImageBlob(targetWidth = 400, targetHeight = 508, mimeType = 'image/jpeg', quality = 0.92) {
      return new Promise((resolve, reject) => {
        const img = imageRef.current;
        if (!img || !img.complete) {
          return reject(new Error('Image is not ready to crop'));
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        // Fill background white in case of transparent PNG converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Calculate scaling ratio from viewport (260x330) to canvas (targetWidth x targetHeight)
        const viewportWidth = 260;
        const viewportHeight = 330;
        const scaleFactorX = targetWidth / viewportWidth;
        const scaleFactorY = targetHeight / viewportHeight;

        ctx.save();
        // Move origin to canvas center
        ctx.translate(targetWidth / 2, targetHeight / 2);

        // Apply pan offset scaled to canvas dimensions
        ctx.translate(position.x * scaleFactorX, position.y * scaleFactorY);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Apply zoom
        // Notice: In the viewport, the image is rendered at natural size or fit?
        // Let's check: if image is rendered at natural size, we scale by (zoom * scaleFactor)
        // To be responsive, let base image display fit within viewport
        const fitScale = Math.max(viewportWidth / img.naturalWidth, viewportHeight / img.naturalHeight);
        const effectiveZoom = zoom * fitScale * scaleFactorX;

        ctx.scale(effectiveZoom, effectiveZoom);

        // Draw image centered at origin
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                dataUrl: canvas.toDataURL(mimeType, quality),
                width: targetWidth,
                height: targetHeight,
              });
            } else {
              reject(new Error('Canvas blob generation failed'));
            }
          },
          mimeType,
          quality
        );
      });
    },
  }));

  // Notify parent of transform changes if needed
  useEffect(() => {
    if (onTransformChange) {
      onTransformChange({ zoom, rotation, position });
    }
  }, [zoom, rotation, position, onTransformChange]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    if (viewportRef.current) {
      viewportRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (viewportRef.current && viewportRef.current.hasPointerCapture(e.pointerId)) {
      viewportRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const adjustZoom = (delta) => {
    setZoom((prev) => Math.max(0.5, Math.min(3.0, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleZoomSlider = (e) => {
    setZoom(parseFloat(e.target.value));
  };

  const adjustRotation = (deltaDeg) => {
    setRotation((prev) => (prev + deltaDeg) % 360);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Fixed Portrait Crop Frame Container */}
      <div className="relative bg-slate-900 rounded-2xl shadow-xl p-2.5 flex items-center justify-center border border-slate-700">
        {/* The Crop Frame (Fixed Portrait Ratio 3:4, 260px by 330px) */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="crop-viewport rounded-xl ring-2 ring-blue-500/80 shadow-2xl bg-black"
        >
          {/* Draggable & Zoomable Image inside */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop target"
            draggable={false}
            className="absolute max-w-none transform-gpu origin-center select-none pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom}) rotate(${rotation}deg)`,
              minWidth: '260px',
              minHeight: '330px',
              objectFit: 'contain',
            }}
          />

          {/* Composition 3x3 Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none crop-grid-overlay opacity-60"></div>

          {/* Corner Guides */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none"></div>
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none"></div>

          {/* Face guide silhouette watermark for student ID alignment */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <svg className="w-36 h-48 stroke-white fill-none stroke-[1.5]" viewBox="0 0 100 130">
              <ellipse cx="50" cy="45" rx="25" ry="32"></ellipse>
              <path d="M 20 120 C 20 90, 80 90, 80 120"></path>
            </svg>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm text-[10px] text-white font-mono px-2 py-0.5 rounded-full border border-white/20">
          Portrait Frame 3:4
        </div>
      </div>

      {/* Cropper Interactive Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-sm">
        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => adjustZoom(-0.15)}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Slider */}
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.05"
          value={zoom}
          onChange={handleZoomSlider}
          className="w-24 accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
        />

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => adjustZoom(0.15)}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>

        {/* Rotate Left */}
        <button
          type="button"
          onClick={() => adjustRotation(-90)}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="Rotate Left 90°"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Rotate Right */}
        <button
          type="button"
          onClick={() => adjustRotation(90)}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="Rotate Right 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>

        {/* Reset Transform */}
        <button
          type="button"
          onClick={resetTransform}
          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Reset All"
        >
          Reset
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1">
        <Move className="w-3 h-3" /> Click & drag photo inside the frame to center
      </p>
    </div>
  );
});

export default ImageCropper;
