import { Box, Typography } from "@mui/material";

/**
 * Simple helper that renders the placeholder message shown when no polygons exist.
 */
const EmptyStateList = () => (
  <Box className="px-6 py-8 text-center text-slate-500">
    <Typography variant="body2">No polygons yet. Start by adding one!</Typography>
  </Box>
);

export default EmptyStateList;
