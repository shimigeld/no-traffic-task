import * as React from "react";
import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";
import type { AppProps, AppType } from "next/app";
import type { EmotionCache } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import createEmotionCache from "@/lib/createEmotionCache";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const originalRenderPage = ctx.renderPage;

    const cache = createEmotionCache();
    const { extractCriticalToChunks } = createEmotionServer(cache);

    type ExtendedApp = AppType<{ emotionCache?: EmotionCache }>;

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App: ExtendedApp) =>
          function EnhanceApp(props: AppProps & { emotionCache?: EmotionCache }) {
            return <App emotionCache={cache} {...props} />;
          },
      });

    const initialProps = await Document.getInitialProps(ctx);
    const emotionStyles = extractCriticalToChunks(initialProps.html);
    const emotionStyleTags = emotionStyles.styles.map((style: { key: string; ids: string[]; css: string }) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(" ")}`}
        key={style.key}
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ));

    return {
      ...initialProps,
      styles: [
        ...React.Children.toArray(initialProps.styles),
        ...emotionStyleTags,
      ],
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#0f172a" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body className="bg-slate-900 text-slate-50">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
