import Head from "next/head";
import { Box } from "@mui/material";
import SideMenu from "@/components/SideMenu";
import CanvasContent from "@/components/CanvasContent";
import ModelManager from "@/components/ModelManager";
import { PolygonsProvider } from "@/contexts/PolygonsContext";

const HomeContent = () => (
  <>
    <Head>
      <title>Polygon Canvas Editor</title>
    </Head>
    <Box className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:flex-row">
      <SideMenu />
      <CanvasContent />
    </Box>
    <ModelManager />
  </>
);

const HomePage = () => (
  <PolygonsProvider>
    <HomeContent />
  </PolygonsProvider>
);

export default HomePage;
