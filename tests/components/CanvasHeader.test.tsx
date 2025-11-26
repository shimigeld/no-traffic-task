import CanvasHeader from "@/components/CanvasHeader";
import { render, screen, fireEvent } from "../test-utils";
import userEvent from "@testing-library/user-event";
import type { Polygon } from "@/types/polygon";

const mockUsePolygonsContext = vi.fn();

vi.mock("@/contexts/PolygonsContext", () => ({
  usePolygonsContext: () => mockUsePolygonsContext(),
}));

describe("CanvasHeader", () => {
  const baseContext = () => ({
    drawingMode: false,
    drawingPoints: [] as [number, number][],
    setNameDialogOpen: vi.fn(),
    polygons: [] as Polygon[],
    selectedId: null as string | null,
    deletePolygon: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePolygonsContext.mockReturnValue(baseContext());
  });

  it("enables finish button when drawing with enough points", async () => {
    const ctx = baseContext();
    ctx.drawingMode = true;
    ctx.drawingPoints = [[0, 0], [1, 1], [2, 2]] as [number, number][];
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<CanvasHeader />);
    const finishButton = screen.getByRole("button", { name: /finish polygon/i });
    expect(finishButton).toBeEnabled();
    await userEvent.click(finishButton);
    expect(ctx.setNameDialogOpen).toHaveBeenCalledWith(true);
  });

  it("disables delete when no polygon selected", () => {
    render(<CanvasHeader />);
    const deleteButton = screen.getByRole("button", { name: /delete selected/i });
    expect(deleteButton).toBeDisabled();
  });

  it("deletes selected polygon", async () => {
    const ctx = baseContext();
    ctx.selectedId = "abc";
    ctx.polygons = [{ id: "abc", name: "Poly", points: [] as [number, number][] }];
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<CanvasHeader />);
    const deleteButton = screen.getByRole("button", { name: /delete selected/i });
    expect(deleteButton).toBeEnabled();
    await userEvent.click(deleteButton);
    expect(ctx.deletePolygon).toHaveBeenCalledWith("abc");
  });

  it("shows drawing instructions when drawing mode active", () => {
    const ctx = baseContext();
    ctx.drawingMode = true;
    ctx.drawingPoints = [[0, 0], [1, 1], [2, 2]];
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<CanvasHeader />);
    expect(screen.getByText(/place vertices/i)).toBeInTheDocument();
  });

  it("does not open naming dialog when finish disabled", async () => {
    const ctx = baseContext();
    ctx.drawingMode = true;
    ctx.drawingPoints = [[0, 0], [1, 1]];
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<CanvasHeader />);
    const finishButton = screen.getByRole("button", { name: /finish polygon/i });
    expect(finishButton).toBeDisabled();
    finishButton.removeAttribute("disabled");
    fireEvent.click(finishButton);
    expect(ctx.setNameDialogOpen).not.toHaveBeenCalled();
  });

  it("ignores delete clicks when nothing selected", () => {
    const ctx = baseContext();
    ctx.polygons = [{ id: "poly-1", name: "Poly", points: [] }];
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<CanvasHeader />);
    const deleteButton = screen.getByRole("button", { name: /delete selected/i });
    expect(deleteButton).toBeDisabled();
    deleteButton.removeAttribute("disabled");
    fireEvent.click(deleteButton);
    expect(ctx.deletePolygon).not.toHaveBeenCalled();
  });
});
