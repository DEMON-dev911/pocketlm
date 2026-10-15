import React, { useEffect, useRef } from 'react';

interface InteractiveDotGridProps {
  isLight?: boolean;
}

export function InteractiveDotGrid({ isLight = false }: InteractiveDotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const activeMouseRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Grid configuration
    const spacing = 28; // Spacing between dots in pixels
    const baseRadius = 1.2;
    const activeRadius = 3.2;
    const hoverRadius = 140;

    // Theme-based colors
    // Dark theme: deep charcoal background, clean light-gray/white dots with a subtle purple tint
    // Light theme: soft light-gray background, dark-gray dots with a purple tint
    const baseOpacity = isLight ? 0.12 : 0.08;
    const activeOpacity = isLight ? 0.75 : 0.85;
    const dotColorRGB = isLight ? '124, 58, 237' : '168, 85, 247'; // purple-600 vs purple-500

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();

    // Use ResizeObserver for precise sizing without stretching
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        resize();
      });
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      activeMouseRef.current = true;
    };

    const handleMouseLeave = () => {
      activeMouseRef.current = false;
      // Smoothly animate mouse away
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    // Smooth position interpolation for the interactive cursor trail
    let currentMouseX = -1000;
    let currentMouseY = -1000;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate the tracker to the actual mouse position for a lag/trail effect
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;

      if (currentMouseX === -1000) {
        currentMouseX = targetX;
        currentMouseY = targetY;
      } else {
        // Linear interpolation for smooth trailing response
        currentMouseX += (targetX - currentMouseX) * 0.15;
        currentMouseY += (targetY - currentMouseY) * 0.15;
      }

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      // Draw subtle glowing spotlight around mouse
      if (currentMouseX > -500 && currentMouseY > -500) {
        const glowGradient = ctx.createRadialGradient(
          currentMouseX,
          currentMouseY,
          10,
          currentMouseX,
          currentMouseY,
          hoverRadius * 1.2
        );
        if (isLight) {
          glowGradient.addColorStop(0, 'rgba(168, 85, 247, 0.04)');
          glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        } else {
          glowGradient.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
          glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        }
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(currentMouseX, currentMouseY, hoverRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw neat uniform grid of dots
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;

          const dx = currentMouseX - x;
          const dy = currentMouseY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let opacity = baseOpacity;
          let radius = baseRadius;

          if (dist < hoverRadius) {
            // Smooth ease transition
            const ratio = 1 - dist / hoverRadius;
            const ease = ratio * ratio * (3 - 2 * ratio); // Smoothstep ease

            opacity = baseOpacity + (activeOpacity - baseOpacity) * ease;
            radius = baseRadius + (activeRadius - baseRadius) * ease;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${dotColorRGB}, ${opacity})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full pointer-events-none transition-opacity duration-700"
      style={{ mixBlendMode: isLight ? 'multiply' : 'screen' }}
    />
  );
}
