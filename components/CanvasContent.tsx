import { Box, Stack } from "@mui/material";
import CanvasEditor from "@/components/CanvasEditor";
import CanvasHeader from "@/components/CanvasHeader";

/**
 * Layout wrapper for the canvas area, providing header controls and the interactive editor.
 */
const CanvasContent = () => (
  <Box className="flex-1 p-4 lg:p-6">
    <Stack spacing={3} className="h-full">
      <CanvasHeader />
      <CanvasEditor />
    </Stack>
  </Box>
);

export default CanvasContent;
