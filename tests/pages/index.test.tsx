import type { ReactElement, ReactNode } from "react";
import HomePage from "@/pages/index";
import { render, screen, waitFor } from "../test-utils";

const providerSpy = vi.fn();

vi.mock("@/components/SideMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="side-menu" />,
}));

vi.mock("@/components/CanvasContent", () => ({
  __esModule: true,
  default: () => <div data-testid="canvas-content" />,
}));

vi.mock("@/components/ModelManager", () => ({
  __esModule: true,
  default: () => <div data-testid="model-manager" />,
}));

vi.mock("@/contexts/PolygonsContext", () => ({
  PolygonsProvider: ({ children }: { children: ReactNode }) => {
    providerSpy(children);
    return <div data-testid="polygons-provider">{children}</div>;
  },
}));

vi.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => {
    const nodes = Array.isArray(children) ? children : [children];
    nodes.forEach((node) => {
      if (!node || typeof node !== "object") return;
      const element = node as ReactElement<{ children?: ReactNode }>;
      if (element.type === "title") {
        const childText = element.props.children;
        if (typeof childText === "string") {
          document.title = childText;
        } else if (Array.isArray(childText)) {
          document.title = childText.filter((value): value is string => typeof value === "string").join("");
        }
      }
    });
    return <>{children}</>;
  },
}));

describe("HomePage", () => {
  beforeEach(() => {
    providerSpy.mockClear();
    document.title = "";
  });

  it("wraps the UI tree with the polygons provider and renders sections", () => {
    render(<HomePage />);

    expect(providerSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("polygons-provider")).toBeInTheDocument();
    expect(screen.getByTestId("side-menu")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-content")).toBeInTheDocument();
    expect(screen.getByTestId("model-manager")).toBeInTheDocument();
  });

  it("sets the document title via next/head", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(document.title).toBe("Polygon Canvas Editor");
    });
  });
});
