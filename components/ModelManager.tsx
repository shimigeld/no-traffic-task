import { useState, type ComponentProps, type ReactNode } from "react";
import { TextField, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Modal, { type ModalAction } from "@/components/Modal";
import { usePolygonsContext } from "@/contexts/PolygonsContext";
import { useCreatePolygonMutation } from "@/services/PolygonService";
import { useToast } from "@/components/Toast";

type DialogBaseProps = Omit<ComponentProps<typeof Modal>, "children">;

type ActiveDialog = {
  props: DialogBaseProps;
  content?: ReactNode;
};

const formatErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/**
 * Coordinates polygon-related modal dialogs (error handling and naming) and wires them to
 * polygon context state plus mutations.
 */
const ModelManager = () => {
  const {
    polygons,
    fetchError,
    nameDialogOpen,
    drawingPoints,
    setDrawingMode,
    setDrawingPoints,
    refetchPolygons,
    setNameDialogOpen,
  } = usePolygonsContext();
  const { pushToast } = useToast();

  const [errorDialogDismissed, setErrorDialogDismissed] = useState(false);
  const [customPolygonName, setCustomPolygonName] = useState<string | null>(null);
  const defaultPolygonName = `Polygon ${polygons.length + 1}`;
  const polygonName = customPolygonName ?? "";

  const resetDrawingState = () => {
    setDrawingMode(false);
    setDrawingPoints([]);
    setNameDialogOpen(false);
  };

  const createPolygonMutation = useCreatePolygonMutation({
    onError: (error) => {
      pushToast({ open: true, severity: "error", message: formatErrorMessage(error, "Failed to add polygon") });
    },
    onSuccess: () => {
      pushToast({ open: true, severity: "success", message: "Polygon added" });
    },
  });

  const errorDialogOpen = Boolean(fetchError) && !errorDialogDismissed;
  const errorDialogMessage = errorDialogOpen ? fetchError?.message || "Unable to load polygons" : "";

  const handleRetry = async () => {
    setErrorDialogDismissed(false);
    await refetchPolygons();
  };

  const handleErrorDialogClose = () => {
    setErrorDialogDismissed(true);
  };

  const handleNameDialogClose = () => {
    setNameDialogOpen(false);
    setCustomPolygonName(null);
  };

  const handleSavePolygon = () => {
    const trimmedCustomName = customPolygonName?.trim() ?? "";
    const fallbackName = trimmedCustomName || defaultPolygonName;
    const trimmed = fallbackName.trim();
    if (!trimmed || drawingPoints.length < 3) return;

    const pendingPoints = drawingPoints;
    setCustomPolygonName(null);
    resetDrawingState();

    createPolygonMutation.mutate(
      { name: trimmed, points: pendingPoints },
      {
        onError: () => {
          setDrawingMode(true);
          setDrawingPoints(pendingPoints);
          setNameDialogOpen(true);
        },
      },
    );
  };

  const drawingPointsCount = drawingPoints.length;

  let activeDialog: ActiveDialog | null = null;
  if (errorDialogOpen) {
    activeDialog = {
      props: {
        open: true,
        title: "Failed to Fetch Polygons",
        description: errorDialogMessage,
        onClose: handleErrorDialogClose,
        actions: [{ label: "Retry", onClick: handleRetry } satisfies ModalAction],
      },
    };
  } else if (nameDialogOpen) {
    activeDialog = {
      props: {
        open: true,
        title: "Name your polygon",
        description: "Provide a friendly name. You can always delete it later if needed.",
        onClose: handleNameDialogClose,
        contentClassName: "space-y-4",
        actions: [
          {
            label: "Cancel",
            onClick: handleNameDialogClose,
            startIcon: <CloseIcon />,
          },
          {
            label: "Save",
            onClick: handleSavePolygon,
            disabled: !polygonName.trim() && !defaultPolygonName.trim(),
          },
        ],
      },
      content: (
        <>
          <TextField
            autoFocus
            fullWidth
            label="Polygon name"
            value={polygonName}
            placeholder={defaultPolygonName}
            onChange={(event) => setCustomPolygonName(event.target.value)}
          />
          <Typography variant="body2" color="text.secondary">
            Vertices: {drawingPointsCount} • Points captured directly from the canvas.
          </Typography>
        </>
      ),
    };
  }

  if (!activeDialog) return null;

  return <Modal {...activeDialog.props}>{activeDialog.content}</Modal>;
};

export default ModelManager;
