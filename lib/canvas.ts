import type { MouseEvent } from "react";

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const getCanvasPoint = (canvas: HTMLCanvasElement | null, event: MouseEvent<HTMLCanvasElement>): [number, number] => {
  if (!canvas) return [0, 0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  return [parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1))];
};
