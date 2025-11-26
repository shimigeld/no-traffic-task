import PolygonListItem from "@/components/PolygonListItem";
import { render, screen } from "../test-utils";
import userEvent from "@testing-library/user-event";

const mockUsePolygonsContext = vi.fn();

vi.mock("@/contexts/PolygonsContext", () => ({
  usePolygonsContext: () => mockUsePolygonsContext(),
}));

describe("PolygonListItem", () => {
  const polygon = { id: "1", name: "Poly", points: [] as [number, number][] };
  const baseContext = () => ({
    selectedId: null,
    hoveredId: null,
    drawingMode: false,
    setHoveredId: vi.fn(),
    selectPolygon: vi.fn(),
    deletePolygon: vi.fn(),
    isLoading: false,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePolygonsContext.mockReturnValue(baseContext());
  });

  it("selects polygon on click", async () => {
    const ctx = baseContext();
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<PolygonListItem polygon={polygon} />);
    await userEvent.click(screen.getByRole("button", { name: polygon.name }));
    expect(ctx.selectPolygon).toHaveBeenCalledWith(polygon.id);
  });

  it("sets hover state when pointer enters and leaves", async () => {
    const ctx = baseContext();
    ctx.setHoveredId = vi.fn((updater: unknown) => {
      if (typeof updater === "function") {
        updater(polygon.id);
        updater("other" as string);
        return;
      }
    });
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<PolygonListItem polygon={polygon} />);
    const button = screen.getByRole("button", { name: polygon.name });
    await userEvent.hover(button);
    expect(ctx.setHoveredId).toHaveBeenCalledWith(polygon.id);
    await userEvent.unhover(button);
    expect(ctx.setHoveredId).toHaveBeenCalledWith(expect.any(Function));
  });

  it("deletes polygon when action clicked", async () => {
    const ctx = baseContext();
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<PolygonListItem polygon={polygon} />);
    const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
    expect(deleteButton).not.toBeNull();
    await userEvent.click(deleteButton!);
    expect(ctx.deletePolygon).toHaveBeenCalledWith(polygon.id);
  });

  it("ignores hover changes while drawing mode is active", async () => {
    const ctx = { ...baseContext(), drawingMode: true };
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<PolygonListItem polygon={polygon} />);
    const button = screen.getByRole("button", { name: polygon.name });
    await userEvent.hover(button);
    await userEvent.unhover(button);
    expect(ctx.setHoveredId).not.toHaveBeenCalled();
  });

  it("disables delete action while loading", () => {
    const ctx = { ...baseContext(), isLoading: true };
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<PolygonListItem polygon={polygon} />);
    const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
    expect(deleteButton).toBeDisabled();
  });
});
