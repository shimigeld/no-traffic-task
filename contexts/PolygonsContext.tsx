import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { AxiosError } from "axios";
import type { Polygon } from "@/types/polygon";
import { useToast } from "@/components/Toast";
import { useDeletePolygonMutation, usePolygonsQuery } from "@/services/PolygonService";

/**
 * Normalizes unknown errors to user-friendly strings while preserving fallback messaging.
 */
const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

type PolygonsRefetch = ReturnType<typeof usePolygonsQuery>["refetch"];

/**
 * Shape of the shared polygon context, mixing async state, UI flags, and CRUD helpers.
 */
interface PolygonsContextValue {
  polygons: Polygon[];
  selectedId: Polygon["id"] | null;
  hoveredId: Polygon["id"] | null;
  isLoading: boolean;
  isFetching: boolean;
  fetchError: AxiosError | null;
  drawingMode: boolean;
  drawingPoints: [number, number][];
  setDrawingPoints: Dispatch<SetStateAction<[number, number][]>>;
  setDrawingMode: Dispatch<SetStateAction<boolean>>;
  nameDialogOpen: boolean;
  setNameDialogOpen: Dispatch<SetStateAction<boolean>>;
  setHoveredId: Dispatch<SetStateAction<Polygon["id"] | null>>;
  refetchPolygons: PolygonsRefetch;
  deletePolygon: (id: Polygon["id"]) => void;
  selectPolygon: (id: Polygon["id"] | null) => void;
}

const PolygonsContext = createContext<PolygonsContextValue | null>(null);

/**
 * Hosts polygon state, CRUD mutations, and shared UI flags so both canvas and menu stay in sync.
 */
export const PolygonsProvider = ({ children }: { children: ReactNode }) => {
  const [selectedId, setSelectedId] = useState<Polygon["id"] | null>(null);
  const [hoveredId, setHoveredId] = useState<Polygon["id"] | null>(null);
  const [drawingMode, setDrawingModeState] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const { pushToast } = useToast();

  const {
    data: polygons = [],
    isLoading,
    isFetching,
    refetch,
    error: fetchError,
  } = usePolygonsQuery();

  const deletePolygonMutation = useDeletePolygonMutation({
    onError: (error) => {
      pushToast({ open: true, severity: "error", message: errorMessage(error, "Failed to delete polygon") });
    },
    onSuccess: () => {
      pushToast({ open: true, severity: "success", message: "Polygon deleted" });
    },
  });

  const handleDeletePolygon = useCallback(
    (id: Polygon["id"]) => {
      const previousSelectedId = selectedId;
      const shouldRestoreSelection = previousSelectedId === id;
      setSelectedId((current) => (current === id ? null : current));
      deletePolygonMutation.mutate(id, {
        onError: () => {
          if (shouldRestoreSelection && previousSelectedId) {
            setSelectedId(previousSelectedId);
          }
        },
      });
    },
    [deletePolygonMutation, selectedId],
  );

  const setDrawingMode = useCallback<Dispatch<SetStateAction<boolean>>>((value) => {
    setDrawingModeState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (next) {
        setHoveredId(null);
      }
      return next;
    });
  }, [setHoveredId]);

  const selectPolygon = useCallback((id: Polygon["id"] | null) => {
    setSelectedId(id);
  }, []);

  const value: PolygonsContextValue = useMemo(
    () => ({
      polygons,
      selectedId,
      hoveredId,
      isLoading,
      isFetching,
      fetchError,
      drawingMode,
      drawingPoints,
      setDrawingPoints,
      setDrawingMode,
      nameDialogOpen,
      setNameDialogOpen,
      setHoveredId,
      refetchPolygons: refetch,
      deletePolygon: handleDeletePolygon,
      selectPolygon,
    }),
    [
      polygons,
      selectedId,
      hoveredId,
      isLoading,
      isFetching,
      fetchError,
      drawingMode,
      drawingPoints,
      setDrawingPoints,
      setDrawingMode,
      nameDialogOpen,
      setNameDialogOpen,
      setHoveredId,
      refetch,
      handleDeletePolygon,
      selectPolygon,
    ],
  );

  return <PolygonsContext.Provider value={value}>{children}</PolygonsContext.Provider>;
};

/**
 * Hook that exposes the polygons context and asserts the provider is present.
 */
export const usePolygonsContext = () => {
  const context = useContext(PolygonsContext);
  if (!context) {
    throw new Error("usePolygonsContext must be used within a PolygonsProvider");
  }
  return context;
};
