import SideMenuHeader from "@/components/SideMenuHeader";
import { render, screen } from "../test-utils";
import userEvent from "@testing-library/user-event";

const mockUsePolygonsContext = vi.fn();

vi.mock("@/contexts/PolygonsContext", () => ({
  usePolygonsContext: () => mockUsePolygonsContext(),
}));

describe("SideMenuHeader", () => {
  const createContextValue = () => ({
    isFetching: false,
    drawingMode: false,
    setDrawingMode: vi.fn(),
    refetchPolygons: vi.fn(),
    setNameDialogOpen: vi.fn(),
    setDrawingPoints: vi.fn(),
    selectPolygon: vi.fn(),
  });

  let contextValue: ReturnType<typeof createContextValue>;

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = createContextValue();
    mockUsePolygonsContext.mockReturnValue(contextValue);
  });

  it("invokes refetch when clicking refresh", async () => {
    render(<SideMenuHeader />);
    const refreshButton = screen.getByTestId("RefreshIcon").closest("button");
    expect(refreshButton).not.toBeNull();
    await userEvent.click(refreshButton!);
    expect(contextValue.refetchPolygons).toHaveBeenCalledTimes(1);
  });

  it("toggles drawing mode when clicking add polygon", async () => {
    render(<SideMenuHeader />);
    await userEvent.click(screen.getByRole("button", { name: /add polygon/i }));
    expect(contextValue.setDrawingMode).toHaveBeenCalledWith(true);
    expect(contextValue.setDrawingPoints).toHaveBeenCalledWith([]);
    expect(contextValue.selectPolygon).toHaveBeenCalledWith(null);
    expect(contextValue.setNameDialogOpen).not.toHaveBeenCalled();
  });

  it("hides refresh button while fetching", () => {
    mockUsePolygonsContext.mockReturnValue({ ...contextValue, isFetching: true });
    render(<SideMenuHeader />);
    expect(screen.queryByRole("button", { name: /refresh polygons/i })).not.toBeInTheDocument();
  });

  it("closes dialog and exits drawing mode when cancelling", async () => {
    const ctx = { ...contextValue, drawingMode: true };
    mockUsePolygonsContext.mockReturnValue(ctx);
    render(<SideMenuHeader />);
    await userEvent.click(screen.getByRole("button", { name: /cancel drawing/i }));
    expect(ctx.setDrawingMode).toHaveBeenCalledWith(false);
    expect(ctx.setNameDialogOpen).toHaveBeenCalledWith(false);
    expect(ctx.selectPolygon).not.toHaveBeenCalled();
  });
});
