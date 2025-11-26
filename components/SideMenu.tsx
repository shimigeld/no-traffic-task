import { Paper } from "@mui/material";
import SideMenuHeader from "@/components/SideMenuHeader";
import PolygonsList from "@/components/PolygonsList";

/**
 * Encapsulates the left-hand control panel containing filter actions and the polygon list.
 */
const SideMenu = () => (
  <Paper
    elevation={4}
    className="w-full border-b border-slate-800 bg-slate-900/70 lg:max-w-md lg:border-b-0 lg:border-r"
  >
    <SideMenuHeader />
    <PolygonsList />
  </Paper>
);

export default SideMenu;
