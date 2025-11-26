import { useEffect, useRef, useState, type MouseEvent } from "react";
import Loader from "@/components/Loader";
import { usePolygonsContext } from "@/contexts/PolygonsContext";
import { CANVAS_HEIGHT, CANVAS_WIDTH, getCanvasPoint } from "@/lib/canvas";
import { isPointInPolygon } from "@/lib/geometry";

const BACKGROUND_IMAGE = "https://picsum.photos/1920/1080";

/**
 * Renders the interactive canvas surface, handling polygon drawing, hover feedback,
 * and selection logic while syncing state with the polygons context.
 */
const CanvasEditor = () => {
  const {
    polygons,
    selectedId,
    hoveredId,
    drawingMode,
    drawingPoints,
    setDrawingPoints,
    isLoading,
    isFetching,
    selectPolygon,
    setHoveredId,
  } = usePolygonsContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const interactiveHoveredId = drawingMode ? null : hoveredId;
  const canvasCursor = drawingMode ? "crosshair" : interactiveHoveredId ? "pointer" : "default";
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleAddDrawingPoint = (point: [number, number]) => {
    setDrawingPoints((prev) => [...prev, point]);
  };

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (isLoading || isFetching) return;
    const [x, y] = getCanvasPoint(canvasRef.current, event);

    if (drawingMode) {
      handleAddDrawingPoint([x, y]);
      return;
    }

    const target = [...polygons].reverse().find((polygon) => isPointInPolygon([x, y], polygon.points));
    selectPolygon(target?.id ?? null);
  };

  const handleCanvasMove = (event: MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode) return;
    const [x, y] = getCanvasPoint(canvasRef.current, event);
    const target = [...polygons].reverse().find((polygon) => isPointInPolygon([x, y], polygon.points));
    setHoveredId(target?.id ?? null);
  };

  const handleCanvasLeave = () => {
    if (!drawingMode) {
      setHoveredId(null);
    }
  };

  useEffect(() => {
    const image = new Image();
    image.src = BACKGROUND_IMAGE;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
      setImageReady(true);
    };
    image.onerror = () => {
      imageRef.current = null;
      setImageReady(false);
    };
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (imageReady && imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    polygons.forEach((polygon) => {
      const isHovered = polygon.id === interactiveHoveredId;
      const isSelected = polygon.id === selectedId;
      const fill = isSelected
        ? "rgba(248, 113, 113, 0.35)"
        : isHovered
        ? "rgba(14, 165, 233, 0.35)"
        : "rgba(56, 189, 248, 0.25)";
      const stroke = isSelected ? "#f87171" : isHovered ? "#38bdf8" : "#0ea5e9";

      ctx.beginPath();
      polygon.points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    });

    if (drawingMode && drawingPoints.length) {
      ctx.beginPath();
      drawingPoints.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();

      drawingPoints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#fde68a";
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();
      });
    }
  }, [drawingMode, drawingPoints, imageReady, interactiveHoveredId, polygons, selectedId]);

  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="h-[45vh] w-full max-w-full rounded-2xl object-contain sm:h-[55vh] lg:h-full"
        style={{ cursor: canvasCursor }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        onMouseLeave={handleCanvasLeave}
      />
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;
