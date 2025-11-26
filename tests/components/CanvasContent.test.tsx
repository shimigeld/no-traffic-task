import CanvasContent from "@/components/CanvasContent";
import { render, screen } from "../test-utils";

vi.mock("@/components/CanvasHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="canvas-header" />,
}));

vi.mock("@/components/CanvasEditor", () => ({
  __esModule: true,
  default: () => <div data-testid="canvas-editor" />,
}));

describe("CanvasContent", () => {
  it("renders the header and editor", () => {
    render(<CanvasContent />);
    expect(screen.getByTestId("canvas-header")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-editor")).toBeInTheDocument();
  });
});
