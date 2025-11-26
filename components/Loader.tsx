import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Small loading indicator shared between list and canvas regions while polygon data resolves.
 */
const Loader = () => (
  <Box className="flex flex-col items-center px-6 py-8 text-slate-500">
    <CircularProgress size={24} className="mb-3" />
    <Typography variant="body2">Loading polygons...</Typography>
  </Box>
);

export default Loader;
