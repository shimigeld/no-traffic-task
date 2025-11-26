import { render, screen } from "../test-utils";
import userEvent from "@testing-library/user-event";
import { PolygonsProvider, usePolygonsContext } from "@/contexts/PolygonsContext";

const polygonsSample = [
  {
    id: "poly-1",
    name: "Poly 1",
    points: [
      [0, 0],
      [1, 0],
      [0, 1],
    ] as [number, number][],
  },
];

const refetchMock = vi.fn();
const mutateMock = vi.fn();
const usePolygonsQueryMock = vi.fn(() => ({
  data: polygonsSample,
  isLoading: false,
  isFetching: false,
  refetch: refetchMock,
  error: null,
}));

vi.mock("@/services/PolygonService", () => ({
  usePolygonsQuery: () => usePolygonsQueryMock(),
  useDeletePolygonMutation: () => ({ mutate: mutateMock }),
}));

vi.mock("@/components/Toast", () => ({
  useToast: () => ({ pushToast: vi.fn() }),
}));

const Consumer = () => {
  const {
    selectedId,
    hoveredId,
    selectPolygon,
    setHoveredId,
    setDrawingMode,
    deletePolygon,
  } = usePolygonsContext();
  return (
    <div>
      <div data-testid="selected">{selectedId ?? "none"}</div>
      <div data-testid="hovered">{hoveredId ?? "none"}</div>
      <button onClick={() => selectPolygon("poly-1")}>Select</button>
      <button onClick={() => {
        setHoveredId("poly-1");
        setDrawingMode(true);
      }}>
        StartDrawing
      </button>
      <button onClick={() => {
        selectPolygon("poly-1");
        deletePolygon("poly-1");
      }}>
        Delete
      </button>
      <button onClick={() => setHoveredId("poly-1")}>
        HoverOnly
      </button>
      <button onClick={() => setDrawingMode(false)}>
        StopDrawing
      </button>
      <button onClick={() => {
        setHoveredId("poly-1");
        setDrawingMode((prev) => !prev);
      }}>
        ToggleDrawingFunction
      </button>
    </div>
  );
};

const OrphanConsumer = () => {
  usePolygonsContext();
  return null;
};

describe("PolygonsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePolygonsQueryMock.mockReturnValue({
      data: polygonsSample,
      isLoading: false,
      isFetching: false,
      refetch: refetchMock,
      error: null,
    });
  });

  it("selects and deletes polygons via context actions", async () => {
    render(
      <PolygonsProvider>
        <Consumer />
      </PolygonsProvider>,
    );

    await userEvent.click(screen.getByText("Select"));
    expect(screen.getByTestId("selected").textContent).toBe("poly-1");

    await userEvent.click(screen.getByText("Delete"));
    expect(mutateMock).toHaveBeenCalledWith("poly-1", expect.any(Object));
    expect(screen.getByTestId("selected").textContent).toBe("none");
  });

  it("clears hovered state when entering drawing mode", async () => {
    render(
      <PolygonsProvider>
        <Consumer />
      </PolygonsProvider>,
    );

    await userEvent.click(screen.getByText("StartDrawing"));
    expect(screen.getByTestId("hovered").textContent).toBe("none");
  });

  it("clears hovered state when toggling drawing mode via updater", async () => {
    render(
      <PolygonsProvider>
        <Consumer />
      </PolygonsProvider>,
    );

    await userEvent.click(screen.getByText("ToggleDrawingFunction"));
    expect(screen.getByTestId("hovered").textContent).toBe("none");
  });

  it("restores selection if deletion fails", async () => {
    mutateMock.mockImplementationOnce((_, options) => {
      options?.onError?.();
    });

    render(
      <PolygonsProvider>
        <Consumer />
      </PolygonsProvider>,
    );

    await userEvent.click(screen.getByText("Select"));
    expect(screen.getByTestId("selected").textContent).toBe("poly-1");
    await userEvent.click(screen.getByText("Delete"));
    expect(screen.getByTestId("selected").textContent).toBe("poly-1");
  });

  it("keeps hover state when leaving drawing mode", async () => {
    render(
      <PolygonsProvider>
        <Consumer />
      </PolygonsProvider>,
    );

    await userEvent.click(screen.getByText("StartDrawing"));
    await userEvent.click(screen.getByText("HoverOnly"));
    expect(screen.getByTestId("hovered").textContent).toBe("poly-1");
    await userEvent.click(screen.getByText("StopDrawing"));
    expect(screen.getByTestId("hovered").textContent).toBe("poly-1");
  });

  it("throws when hook used outside provider", () => {
    expect(() => render(<OrphanConsumer />)).toThrow(/usePolygonsContext must be used within a PolygonsProvider/);
  });
});
