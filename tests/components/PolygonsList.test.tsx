import PolygonsList from "@/components/PolygonsList";
import { render, screen } from "../test-utils";

const mockUsePolygonsContext = vi.fn();

vi.mock("@/contexts/PolygonsContext", () => ({
  usePolygonsContext: () => mockUsePolygonsContext(),
}));

vi.mock("@/components/PolygonListItem", () => ({
  __esModule: true,
  default: ({ polygon }: { polygon: { id: string; name: string } }) => (
    <li data-testid="polygon-item">{polygon.name}</li>
  ),
}));

describe("PolygonsList", () => {
  const baseValue = () => ({
    polygons: [],
    isLoading: false,
    isFetching: false,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePolygonsContext.mockReturnValue(baseValue());
  });

  it("renders loader while fetching", () => {
    mockUsePolygonsContext.mockReturnValue({ ...baseValue(), isLoading: true });
    render(<PolygonsList />);
    expect(screen.getByText(/loading polygons/i)).toBeVisible();
  });

  it("shows loader during background refetches", () => {
    mockUsePolygonsContext.mockReturnValue({ ...baseValue(), isFetching: true });
    render(<PolygonsList />);
    expect(screen.getByText(/loading polygons/i)).toBeVisible();
  });

  it("renders list items when polygons exist", () => {
    mockUsePolygonsContext.mockReturnValue({
      ...baseValue(),
      polygons: [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ],
    });
    render(<PolygonsList />);
    expect(screen.getAllByTestId("polygon-item")).toHaveLength(2);
  });

  it("shows empty state when no polygons", () => {
    render(<PolygonsList />);
    expect(screen.getByText(/no polygons yet/i)).toBeVisible();
  });
});
