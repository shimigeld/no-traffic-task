import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import apiClient from "@/lib/api";
import {
  fetchPolygons,
  POLYGONS_QUERY_KEY,
  useCreatePolygonMutation,
  useDeletePolygonMutation,
} from "@/services/PolygonService";
import type { Polygon } from "@/types/polygon";

vi.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockedApiClient = apiClient as unknown as ApiMock;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (client: QueryClient) => ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchPolygons", () => {
  it("normalizes server coordinates", async () => {
    const rawPolygons = [
      {
        id: "1",
        name: "A",
        points: [
          ["1", "2"],
          ["3", "4"],
        ],
      },
    ] as unknown as Polygon[];

    mockedApiClient.get.mockResolvedValue({ data: rawPolygons });

    const result = await fetchPolygons();

    expect(mockedApiClient.get).toHaveBeenCalledWith("/polygons");
    expect(result).toEqual([
      {
        id: "1",
        name: "A",
        points: [
          [1, 2],
          [3, 4],
        ],
      },
    ]);
  });
});

describe("useCreatePolygonMutation", () => {
  it("adds an optimistic polygon and replaces it with normalized server data", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const existingPolygon: Polygon = {
      id: "existing",
      name: "Existing",
      points: [
        [0, 0],
        [1, 1],
      ],
    };
    queryClient.setQueryData(POLYGONS_QUERY_KEY, [existingPolygon]);

    const serverResponse = {
      id: "server-1",
      name: "Draft",
      points: [
        ["7", "8"],
        ["9", "10"],
      ],
    } as unknown as Polygon;

    let resolvePost: ((value: { data: Polygon }) => void) | undefined;
    mockedApiClient.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(42);

    const { result } = renderHook(() => useCreatePolygonMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({
        name: "Draft",
        points: [
          [5, 5],
          [6, 6],
        ],
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Polygon[]>(POLYGONS_QUERY_KEY);
      expect(cached).toEqual([
        existingPolygon,
        {
          id: "temp-42",
          name: "Draft",
          points: [
            [5, 5],
            [6, 6],
          ],
        },
      ]);
    });

    resolvePost?.({ data: serverResponse });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Polygon[]>(POLYGONS_QUERY_KEY);
      expect(cached).toEqual([
        existingPolygon,
        {
          id: "server-1",
          name: "Draft",
          points: [
            [7, 8],
            [9, 10],
          ],
        },
      ]);
    });

    dateNowSpy.mockRestore();
  });

  it("rolls back the cache and invalidates the query when creation fails", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const existingPolygon: Polygon = {
      id: "existing",
      name: "Existing",
      points: [
        [0, 0],
        [1, 1],
      ],
    };
    queryClient.setQueryData(POLYGONS_QUERY_KEY, [existingPolygon]);

    const error = new Error("creation failed");
    mockedApiClient.post.mockRejectedValue(error);

    const onError = vi.fn();
    const onSettled = vi.fn();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useCreatePolygonMutation({ onError, onSettled }),
      { wrapper },
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          name: "Broken",
          points: [
            [2, 2],
            [3, 3],
          ],
        }),
      ).rejects.toThrow("creation failed");
    });

    expect(queryClient.getQueryData(POLYGONS_QUERY_KEY)).toEqual([existingPolygon]);
    expect(onError).toHaveBeenCalledWith(
      error,
      expect.any(Object),
      expect.objectContaining({ previousPolygons: [existingPolygon] }),
      expect.any(Object),
    );

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: POLYGONS_QUERY_KEY });
    });
    expect(onSettled).toHaveBeenCalled();
  });
});

describe("useDeletePolygonMutation", () => {
  it("removes the polygon optimistically and restores it on failure", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const polygons: Polygon[] = [
      {
        id: "keep",
        name: "Keep",
        points: [
          [0, 0],
          [1, 1],
        ],
      },
      {
        id: "remove",
        name: "Remove",
        points: [
          [2, 2],
          [3, 3],
        ],
      },
    ];
    queryClient.setQueryData(POLYGONS_QUERY_KEY, polygons);

    const error = new Error("delete failed");
    let rejectDelete: ((reason?: unknown) => void) | undefined;
    mockedApiClient.delete.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectDelete = reject;
        }),
    );

    const onError = vi.fn();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useDeletePolygonMutation({ onError }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate("remove");
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Polygon[]>(POLYGONS_QUERY_KEY);
      expect(cached).toEqual([polygons[0]]);
    });

    rejectDelete?.(error);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        error,
        "remove",
        expect.objectContaining({ previousPolygons: polygons }),
        expect.any(Object),
      );
      expect(queryClient.getQueryData(POLYGONS_QUERY_KEY)).toEqual(polygons);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: POLYGONS_QUERY_KEY });
    });
  });
});
