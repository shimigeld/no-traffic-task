import * as React from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import type { EmotionCache } from "@emotion/react";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ToastProvider from "@/components/Toast";
import createEmotionCache from "@/lib/createEmotionCache";
import "@/styles/globals.css";

const clientSideEmotionCache = createEmotionCache();

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#38bdf8",
    },
    secondary: {
      main: "#fbbf24",
    },
    background: {
      default: "#020617",
      paper: "#0f172a",
    },
  },
  typography: {
    fontFamily: "Inter, var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
});

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const queryClient = new QueryClient();

const MyApp = (props: MyAppProps) => {
  const { Component, pageProps, emotionCache = clientSideEmotionCache } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Component {...pageProps} />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MyApp;
