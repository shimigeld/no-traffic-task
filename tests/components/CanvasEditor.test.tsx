import CanvasEditor from "@/components/CanvasEditor";
import { render, fireEvent, waitFor, act } from "../test-utils";

type Point = [number, number];

const mockUsePolygonsContext = vi.fn();
const mockIsPointInPolygon = vi.fn<(point: Point, polygon: Point[]) => boolean>(() => true);
const mockGetCanvasPoint = vi.fn(() => [1, 1] as Point);

vi.mock("@/contexts/PolygonsContext", () => ({
  usePolygonsContext: () => mockUsePolygonsContext(),
}));

vi.mock("@/lib/geometry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/geometry")>("@/lib/geometry");
  return {
    ...actual,
    isPointInPolygon: (...args: Parameters<typeof actual.isPointInPolygon>) => mockIsPointInPolygon(...args),
  };
});

vi.mock("@/lib/canvas", () => ({
  CANVAS_HEIGHT: 100,
  CANVAS_WIDTH: 100,
  getCanvasPoint: (...args: unknown[]) => mockGetCanvasPoint(...(args as Parameters<typeof mockGetCanvasPoint>)),
}));

const createContextValue = () => ({
  polygons: [
    {
      id: "poly-1",
      name: "Poly 1",
      points: [
        [0, 0],
        [1, 0],
        [0, 1],
      ] as [number, number][],
    },
  ],
  selectedId: null,
  hoveredId: null,
  drawingMode: false,
  drawingPoints: [] as Point[],
  setDrawingPoints: vi.fn(),
  setDrawingMode: vi.fn(),
  setHoveredId: vi.fn(),
  setNameDialogOpen: vi.fn(),
  selectPolygon: vi.fn(),
  isLoading: false,
  isFetching: false,
});

describe("CanvasEditor", () => {
  const originalImage = global.Image;
  const context2d = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;

  let getContextSpy: ReturnType<typeof vi.spyOn>;

  let lastImageInstance: HTMLImageElement | null = null;

  beforeAll(() => {
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    getContextSpy.mockReturnValue(context2d);

    class ImageMock {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        // no-op, tests manually invoke onload/onerror
      }

      constructor() {
        lastImageInstance = this as unknown as HTMLImageElement;
      }
    }

    // @ts-expect-error overriding for tests
    global.Image = ImageMock;
  });

  afterAll(() => {
    getContextSpy?.mockRestore();
    global.Image = originalImage;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCanvasPoint.mockReturnValue([1, 1] as Point);
    mockIsPointInPolygon.mockReturnValue(true);
    lastImageInstance = null;
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
  });

  it("selects polygon when canvas clicked outside drawing mode", () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.click(canvas!);
    expect(contextValue.selectPolygon).toHaveBeenCalledWith("poly-1");
  });

  it("sets hovered polygon on mouse move", () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.mouseMove(canvas!);
    expect(contextValue.setHoveredId).toHaveBeenCalledWith("poly-1");
  });

  it("adds drawing points while in drawing mode", () => {
    const contextValue = createContextValue();
    contextValue.drawingMode = true;
    mockUsePolygonsContext.mockReturnValue(contextValue);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.click(canvas!);
    expect(contextValue.setDrawingPoints).toHaveBeenCalledWith(expect.any(Function));
    fireEvent.mouseMove(canvas!);
    expect(contextValue.setHoveredId).not.toHaveBeenCalled();
  });

  it("clears hover state when leaving the canvas", () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.mouseLeave(canvas!);
    expect(contextValue.setHoveredId).toHaveBeenCalledWith(null);
  });

  it("renders loader overlay while fetching", () => {
    const contextValue = createContextValue();
    contextValue.isLoading = true;
    mockUsePolygonsContext.mockReturnValue(contextValue);
    render(<CanvasEditor />);
    expect(document.querySelector(".absolute")).toBeTruthy();
  });

  it("draws background image once loaded", async () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    render(<CanvasEditor />);
    expect(lastImageInstance).not.toBeNull();
    act(() => {
      lastImageInstance?.onload?.(new Event("load"));
    });
    await waitFor(() => {
      expect(context2d.drawImage).toHaveBeenCalled();
    });
  });

  it("renders drawing guides when points exist", async () => {
    const contextValue = createContextValue();
    contextValue.drawingMode = true;
    contextValue.drawingPoints = [
      [0, 0],
      [1, 1],
      [2, 2],
    ];
    mockUsePolygonsContext.mockReturnValue(contextValue);
    render(<CanvasEditor />);
    act(() => {
      lastImageInstance?.onload?.(new Event("load"));
    });
    await waitFor(() => {
      expect(context2d.arc).toHaveBeenCalled();
    });
  });

  it("handles background image failures", async () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    render(<CanvasEditor />);
    act(() => {
      lastImageInstance?.onerror?.(new Event("error"));
    });
    await waitFor(() => {
      expect(context2d.fillRect).toHaveBeenCalled();
    });
  });

  it("ignores pointer events while loading", () => {
    const contextValue = createContextValue();
    contextValue.isLoading = true;
    mockUsePolygonsContext.mockReturnValue(contextValue);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.click(canvas!);
    expect(contextValue.selectPolygon).not.toHaveBeenCalled();
  });

  it("clears hovered polygon when pointer leaves canvas", () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.mouseLeave(canvas!);
    expect(contextValue.setHoveredId).toHaveBeenCalledWith(null);
  });

  it("preserves hovered state when leaving canvas during drawing", () => {
    const contextValue = createContextValue();
    contextValue.drawingMode = true;
    mockUsePolygonsContext.mockReturnValue(contextValue);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.mouseLeave(canvas!);
    expect(contextValue.setHoveredId).not.toHaveBeenCalled();
  });

  it("clears hovered id when pointer misses all polygons", () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    mockIsPointInPolygon.mockReturnValue(false);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.mouseMove(canvas!);
    expect(contextValue.setHoveredId).toHaveBeenCalledWith(null);
  });

  it("clears selection when clicking empty space", () => {
    const contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
    mockIsPointInPolygon.mockReturnValue(false);
    const { container } = render(<CanvasEditor />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    fireEvent.click(canvas!);
    expect(contextValue.selectPolygon).toHaveBeenCalledWith(null);
  });
});
