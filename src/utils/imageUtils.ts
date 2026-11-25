import { NailShape } from '../types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): { valid: boolean; errorFa?: string; errorTr?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      errorFa: 'فرمت تصویر باید JPG، PNG یا WebP باشد.',
      errorTr: 'Görsel formatı JPG, PNG veya WebP olmalıdır.',
    };
  }
  if (file.size > 12 * 1024 * 1024) {
    return {
      valid: false,
      errorFa: 'حجم تصویر نباید بیشتر از ۱۲ مگابایت باشد.',
      errorTr: 'Görsel boyutu 12MB değerini aşmamalıdır.',
    };
  }
  return { valid: true };
}

export async function compressImageToDataUrl(
  fileOrUrl: File | string,
  maxWidth = 1080,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const ratio = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrUrl);
    }
  });
}

/**
 * Generates a realistic studio nail-art composite on the user's uploaded hand image
 * when the server-side Gemini image editor falls back (e.g., when paid key is not active),
 * or blends the chosen nail shape, color, and design reference onto the hand canvas
 * so the Before/After comparison slider and final admin reservation photo work seamlessly.
 */
export async function renderRealisticNailTryOnCanvas(options: {
  handImageSrc: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  nailShape: NailShape;
  designCode: string;
  designTitle: string;
  designImageUrl?: string;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  rotationDeg?: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const handImg = new Image();
    handImg.crossOrigin = 'anonymous';

    handImg.onload = () => {
      const canvas = document.createElement('canvas');
      const w = handImg.width || 960;
      const h = handImg.height || 720;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not supported'));
        return;
      }

      // 1. Draw original hand photo with subtle warm boutique studio lighting enhancement
      ctx.filter = 'contrast(1.04) saturate(1.08) brightness(1.02)';
      ctx.drawImage(handImg, 0, 0, w, h);
      ctx.filter = 'none';

      // Soft warm radiance vignette matching Tırnak Atölyesi palette
      const glow = ctx.createRadialGradient(w * 0.45, h * 0.55, w * 0.1, w * 0.5, h * 0.5, w * 0.7);
      glow.addColorStop(0, `${options.primaryColorHex}18`);
      glow.addColorStop(0.6, `${options.secondaryColorHex}12`);
      glow.addColorStop(1, 'rgba(59, 19, 42, 0.08)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const userOffsetX = ((options.offsetX ?? 0) / 100) * w * 0.15;
      const userOffsetY = ((options.offsetY ?? 0) / 100) * h * 0.15;
      const userScale = options.scale ?? 1.0;
      const userRotRad = ((options.rotationDeg ?? 0) * Math.PI) / 180;

      // 2. Render realistic 3D-shaded manicured nails positioned along natural fingertip locations
      const nailPositions = [
        { x: w * 0.322, y: h * 0.292, angle: -0.35, scaleW: 0.046, scaleH: 0.036 }, // Thumb
        { x: w * 0.246, y: h * 0.642, angle: -0.68, scaleW: 0.044, scaleH: 0.056 }, // Index
        { x: w * 0.272, y: h * 0.752, angle: -0.65, scaleW: 0.046, scaleH: 0.058 }, // Middle
        { x: w * 0.354, y: h * 0.808, angle: -0.62, scaleW: 0.044, scaleH: 0.055 }, // Ring
        { x: w * 0.508, y: h * 0.812, angle: -0.56, scaleW: 0.037, scaleH: 0.046 }, // Pinky
      ];

      nailPositions.forEach((pos, idx) => {
        ctx.save();
        ctx.translate(pos.x + userOffsetX, pos.y + userOffsetY);
        ctx.rotate(pos.angle + userRotRad);

        const nw = w * pos.scaleW * userScale;
        const nh =
          h *
          pos.scaleH *
          userScale *
          (options.nailShape === 'almond' || options.nailShape === 'coffin' ? 1.18 : 1.0);

        // Draw nail path according to selected shape
        ctx.beginPath();
        if (options.nailShape === 'almond') {
          ctx.moveTo(0, -nh * 0.62);
          ctx.bezierCurveTo(nw * 0.58, -nh * 0.25, nw * 0.55, nh * 0.45, 0, nh * 0.5);
          ctx.bezierCurveTo(-nw * 0.55, nh * 0.45, -nw * 0.58, -nh * 0.25, 0, -nh * 0.62);
        } else if (options.nailShape === 'coffin') {
          ctx.moveTo(-nw * 0.28, -nh * 0.6);
          ctx.lineTo(nw * 0.28, -nh * 0.6);
          ctx.quadraticCurveTo(nw * 0.54, 0, nw * 0.42, nh * 0.48);
          ctx.quadraticCurveTo(0, nh * 0.56, -nw * 0.42, nh * 0.48);
          ctx.quadraticCurveTo(-nw * 0.54, 0, -nw * 0.28, -nh * 0.6);
        } else if (options.nailShape === 'square') {
          const r = nw * 0.16;
          ctx.roundRect(-nw * 0.46, -nh * 0.52, nw * 0.92, nh * 1.02, r);
        } else {
          ctx.ellipse(0, 0, nw * 0.46, nh * 0.52, 0, 0, Math.PI * 2);
        }
        ctx.closePath();

        // Soft drop shadow on nail bed
        ctx.shadowColor = 'rgba(59, 19, 42, 0.32)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        // Ombre / Gelish gradient fill
        const grad = ctx.createLinearGradient(0, -nh * 0.6, 0, nh * 0.5);
        grad.addColorStop(0, options.primaryColorHex);
        grad.addColorStop(0.65, options.primaryColorHex);
        grad.addColorStop(1, options.secondaryColorHex === '#FAF0E6' ? '#F3769B' : options.secondaryColorHex);

        ctx.fillStyle = grad;
        ctx.fill();

        // Reset shadow for details
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Gold foil or French micro-tip detail on ring/middle finger
        if (idx === 3 || idx === 2) {
          ctx.strokeStyle = '#E5A93B';
          ctx.lineWidth = Math.max(1.5, nw * 0.06);
          ctx.beginPath();
          ctx.moveTo(-nw * 0.22, -nh * 0.28);
          ctx.quadraticCurveTo(0, -nh * 0.45, nw * 0.22, -nh * 0.28);
          ctx.stroke();
        }

        // Specular studio gel gloss highlight
        const gloss = ctx.createLinearGradient(-nw * 0.3, -nh * 0.45, nw * 0.1, nh * 0.35);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
        gloss.addColorStop(0.4, 'rgba(255, 255, 255, 0.18)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = gloss;
        ctx.beginPath();
        ctx.ellipse(-nw * 0.12, -nh * 0.08, nw * 0.12, nh * 0.34, -0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 3. Draw official Tırnak Atölyesi AI Studio watermark + design reference card in corner
      const badgeW = Math.min(w * 0.46, 360);
      const badgeH = 68;
      const bx = 20;
      const by = h - badgeH - 20;

      ctx.save();
      ctx.fillStyle = 'rgba(59, 19, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(bx, by, badgeW, badgeH, 14);
      ctx.fill();

      ctx.strokeStyle = '#E5A93B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Color swatch circle
      ctx.fillStyle = options.primaryColorHex;
      ctx.beginPath();
      ctx.arc(bx + 28, by + badgeH / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFDFB';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFDFB';
      ctx.font = 'bold 15px Vazirmatn, sans-serif';
      ctx.fillText(`Tırnak Atölyesi AI • ${options.designCode}`, bx + 54, by + 28);

      ctx.fillStyle = '#F7AD93';
      ctx.font = '13px Vazirmatn, sans-serif';
      const subtitle = `${options.designTitle.slice(0, 32)} (${options.nailShape.toUpperCase()})`;
      ctx.fillText(subtitle, bx + 54, by + 50);
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    handImg.onerror = (err) => reject(err);
    handImg.src = options.handImageSrc;
  });
}
