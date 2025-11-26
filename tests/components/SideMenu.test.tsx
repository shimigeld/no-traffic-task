import SideMenu from "@/components/SideMenu";
import { render, screen } from "../test-utils";

vi.mock("@/components/SideMenuHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="side-menu-header" />,
}));

vi.mock("@/components/PolygonsList", () => ({
  __esModule: true,
  default: () => <div data-testid="polygons-list" />,
}));

describe("SideMenu", () => {
  it("renders header and polygons list", () => {
    render(<SideMenu />);
    expect(screen.getByTestId("side-menu-header")).toBeInTheDocument();
    expect(screen.getByTestId("polygons-list")).toBeInTheDocument();
  });
});
