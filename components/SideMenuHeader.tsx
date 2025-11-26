import { Box, Button, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { usePolygonsContext } from "@/contexts/PolygonsContext";

/**
 * Provides controls for refreshing polygons and toggling drawing mode from the side menu.
 */
const SideMenuHeader = () => {
  const { isFetching, drawingMode, setDrawingMode, refetchPolygons, setNameDialogOpen, setDrawingPoints, selectPolygon } = usePolygonsContext();

  const handleToggleDrawing = () => {
    // Flip drawing mode and reset related state so canvas/UI stay in sync
    const nextMode = !drawingMode; // Determine whether we are entering or exiting drawing mode
    setDrawingMode(nextMode); // Persist the newly determined drawing mode
    setDrawingPoints([]); // Clear any existing in-progress points to avoid stale shapes

    if (nextMode) {
      selectPolygon(null); // When starting a new drawing, ensure nothing remains selected
    } else {
      setNameDialogOpen(false); // When leaving drawing mode, force the naming dialog to close
    }
  };

  return (
    <>
      <Box className="flex items-center justify-between px-6 py-4">
        <div>
          <Typography variant="h6" className="font-semibold">
            Polygons
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hover or select items to highlight on canvas
          </Typography>
        </div>
        {!isFetching && (
          <Tooltip title="Refresh polygons">
            <span>
              <IconButton onClick={() => refetchPolygons()} color="primary">
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
      <Divider className="border-slate-800" />
      <Box className="px-6 py-4 flex gap-2">
        <Button
          variant="contained"
          startIcon={drawingMode ? <CloseIcon /> : <AddIcon />}
          color={drawingMode ? "secondary" : "primary"}
          onClick={handleToggleDrawing}
          fullWidth
        >
          {drawingMode ? "Cancel Drawing" : "Add Polygon"}
        </Button>
      </Box>
      <Divider className="border-slate-800" />
    </>
  );
};

export default SideMenuHeader;
