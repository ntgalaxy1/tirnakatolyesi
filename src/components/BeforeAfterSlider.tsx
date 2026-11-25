import React, { useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  hintText: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  hintText,
}) => {
  const [sliderPosition, setSliderPosition] = useState(68);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  return (
    <div className="space-y-2" data-testid="before-after-slider">
      <div
        ref={containerRef}
        onMouseMove={(e) => {
          if (e.buttons === 1) handleMove(e.clientX);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMove(e.touches[0].clientX);
        }}
        onClick={(e) => handleMove(e.clientX)}
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#3B132A]/15 bg-[#FAF0E6] select-none cursor-ew-resize"
      >
        {/* Base Layer: Before Image (Original Hand on Right) */}
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
          draggable={false}
        />

        {/* Clipped Layer: After Image (AI Output on Left, covering fingernails) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        </div>

        {/* Vertical Divider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#FFFDFB] shadow-md pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#3B132A] text-[#FFFDFB] border-2 border-[#E5A93B] shadow-lg flex items-center justify-center">
            <MoveHorizontal className="w-5 h-5" />
          </div>
        </div>

        {/* Corner Labels matching Left (AI Output) and Right (Original Hand) */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-[#D42663]/90 backdrop-blur-sm text-white text-xs font-medium pointer-events-none">
          {afterLabel}
        </div>
        <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-[#3B132A]/80 backdrop-blur-sm text-[#FFFDFB] text-xs font-medium pointer-events-none">
          {beforeLabel}
        </div>
      </div>

      {/* Accessible Range Input for Keyboard & Screen Reader Users */}
      <div className="flex items-center gap-3 px-1">
        <label htmlFor="ai-comparison-range" className="text-xs text-[#3B132A]/75 shrink-0">
          {hintText}
        </label>
        <input
          id="ai-comparison-range"
          type="range"
          min={0}
          max={100}
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="w-full accent-[#D42663] cursor-pointer"
        />
      </div>
    </div>
  );
};
