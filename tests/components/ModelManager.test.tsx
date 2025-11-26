import ModelManager from "@/components/ModelManager";
import { render, screen, waitFor } from "../test-utils";
import type { AxiosError } from "axios";
import userEvent from "@testing-library/user-event";

const mockUsePolygonsContext = vi.fn();
type MutationHandlers = { onError?: (error: unknown) => void; onSuccess?: () => void };
const mockCreatePolygonMutation = { mutate: vi.fn() };
let createPolygonMutationConfig: MutationHandlers | undefined;
const mockPushToast = vi.fn();

vi.mock("@/contexts/PolygonsContext", () => ({
  usePolygonsContext: () => mockUsePolygonsContext(),
}));

vi.mock("@/services/PolygonService", () => ({
  useCreatePolygonMutation: (config: MutationHandlers) => {
    createPolygonMutationConfig = config;
    return mockCreatePolygonMutation;
  },
}));

vi.mock("@/components/Toast", () => ({
  useToast: () => ({ pushToast: mockPushToast }),
}));

const createContextValue = (overrides: Record<string, unknown> = {}) => ({
  polygons: [],
  selectedId: null,
  hoveredId: null,
  isLoading: false,
  isFetching: false,
  fetchError: null,
  drawingMode: false,
  drawingPoints: [] as [number, number][],
  setDrawingPoints: vi.fn(),
  setDrawingMode: vi.fn(),
  setHoveredId: vi.fn(),
  nameDialogOpen: false,
  setNameDialogOpen: vi.fn(),
  refetchPolygons: vi.fn().mockResolvedValue(undefined),
  deletePolygon: vi.fn(),
  selectPolygon: vi.fn(),
  ...overrides,
});

describe("ModelManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePolygonsContext.mockReturnValue(createContextValue());
    createPolygonMutationConfig = undefined;
  });

  it("renders error dialog and retries when fetch fails", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mockUsePolygonsContext.mockReturnValue(
      createContextValue({ fetchError: new Error("boom"), refetchPolygons: refetch }),
    );

    render(<ModelManager />);
    expect(screen.getByText(/failed to fetch polygons/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("dismisses error dialog when closed", async () => {
    mockUsePolygonsContext.mockReturnValue(
      createContextValue({ fetchError: new Error("boom"), refetchPolygons: vi.fn() }),
    );

    render(<ModelManager />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("falls back to default fetch error messaging", () => {
    const emptyMessageError = { message: "" } as AxiosError;
    mockUsePolygonsContext.mockReturnValue(
      createContextValue({ fetchError: emptyMessageError, refetchPolygons: vi.fn() }),
    );

    render(<ModelManager />);
    expect(screen.getByText(/unable to load polygons/i)).toBeInTheDocument();
  });

  it("saves polygon when naming dialog is submitted", async () => {
    const drawingPoints: [number, number][] = [
      [0, 0],
      [1, 1],
      [2, 2],
    ];
    const setDrawingMode = vi.fn();
    const setDrawingPoints = vi.fn();
    const setNameDialogOpen = vi.fn();

    mockUsePolygonsContext.mockReturnValue(
      createContextValue({
        nameDialogOpen: true,
        drawingPoints,
        setDrawingMode,
        setDrawingPoints,
        setNameDialogOpen,
      }),
    );

    render(<ModelManager />);

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);

    expect(mockCreatePolygonMutation.mutate).toHaveBeenCalledWith(
      { name: "Polygon 1", points: drawingPoints },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    expect(setDrawingMode).toHaveBeenCalledWith(false);
    expect(setDrawingPoints).toHaveBeenCalledWith([]);
    expect(setNameDialogOpen).toHaveBeenCalledWith(false);
  });

  it("restores drawing state when save mutation fails", async () => {
    const drawingPoints: [number, number][] = [
      [0, 0],
      [1, 1],
      [2, 2],
    ];
    const setDrawingMode = vi.fn();
    const setDrawingPoints = vi.fn();
    const setNameDialogOpen = vi.fn();

    mockUsePolygonsContext.mockReturnValue(
      createContextValue({
        nameDialogOpen: true,
        drawingPoints,
        setDrawingMode,
        setDrawingPoints,
        setNameDialogOpen,
      }),
    );

    render(<ModelManager />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    const [, options] = mockCreatePolygonMutation.mutate.mock.calls[0];
    expect(options?.onError).toBeDefined();
    options?.onError?.();

    expect(setDrawingMode).toHaveBeenCalledWith(true);
    expect(setDrawingPoints).toHaveBeenCalledWith(drawingPoints);
    expect(setNameDialogOpen).toHaveBeenCalledWith(true);
  });

  it("cancels naming dialog and clears custom state", async () => {
    const setNameDialogOpen = vi.fn();
    mockUsePolygonsContext.mockReturnValue(
      createContextValue({
        nameDialogOpen: true,
        drawingPoints: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        setNameDialogOpen,
      }),
    );

    render(<ModelManager />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(setNameDialogOpen).toHaveBeenCalledWith(false);
  });

  it("prevents save when not enough points collected", async () => {
    mockUsePolygonsContext.mockReturnValue(
      createContextValue({
        nameDialogOpen: true,
        drawingPoints: [
          [0, 0],
          [1, 1],
        ],
      }),
    );

    render(<ModelManager />);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(mockCreatePolygonMutation.mutate).not.toHaveBeenCalled();
  });

  it("trims custom polygon names before saving", async () => {
    const drawingPoints: [number, number][] = [
      [0, 0],
      [1, 1],
      [2, 2],
    ];

    mockUsePolygonsContext.mockReturnValue(
      createContextValue({
        nameDialogOpen: true,
        drawingPoints,
      }),
    );

    render(<ModelManager />);
    const input = screen.getByLabelText(/polygon name/i);
    await userEvent.clear(input);
    await userEvent.type(input, "   Custom Name   ");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mockCreatePolygonMutation.mutate).toHaveBeenLastCalledWith(
      { name: "Custom Name", points: drawingPoints },
      expect.any(Object),
    );
  });

  it("pushes toast feedback for mutation lifecycle", () => {
    render(<ModelManager />);
    expect(createPolygonMutationConfig).toBeDefined();

    createPolygonMutationConfig?.onError?.(new Error("boom"));
    createPolygonMutationConfig?.onError?.("bad" as unknown as Error);
    createPolygonMutationConfig?.onSuccess?.();

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "error", message: "boom" }),
    );
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "error", message: "Failed to add polygon" }),
    );
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "success", message: "Polygon added" }),
    );
  });
});
