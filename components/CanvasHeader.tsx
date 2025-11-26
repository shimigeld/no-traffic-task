import { Box, Button, Stack, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { usePolygonsContext } from "@/contexts/PolygonsContext";

/**
 * Displays contextual instructions and canvas-level actions such as finishing a drawing
 * or deleting the currently selected polygon.
 */
const CanvasHeader = () => {
  const { drawingMode, drawingPoints, setNameDialogOpen, polygons, selectedId, deletePolygon } = usePolygonsContext();

  const drawingPointsCount = drawingPoints.length;
  const finishDisabled = drawingPointsCount < 3;
  const selectedPolygon = polygons.find((polygon) => polygon.id === selectedId);
  const deleteDisabled = !selectedPolygon;
  const instructions = drawingMode
    ? "Click on the canvas to place vertices, then finish when ready."
    : "Hover and click polygons to highlight or select.";

  const handleFinishPolygon = () => {
    if (finishDisabled) return;
    setNameDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    deletePolygon(selectedId);
  };

  return (
    <Box className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <Typography variant="h5" className="font-semibold">
          Canvas Editor
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {instructions}
        </Typography>
      </div>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} className="w-full sm:w-auto">
        {drawingMode && (
          <Button variant="outlined" color="secondary" disabled={finishDisabled} onClick={handleFinishPolygon}>
            Finish Polygon
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          disabled={deleteDisabled}
          startIcon={<DeleteIcon />}
          onClick={handleDeleteSelected}
        >
          Delete Selected
        </Button>
      </Stack>
    </Box>
  );
};

export default CanvasHeader;
