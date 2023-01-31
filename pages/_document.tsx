/* eslint-disable react/display-name */
import Document, { Html, Head, Main, NextScript } from 'next/document';
import * as React from 'react';
import { ServerStyleSheet } from 'styled-components';

// example here: https://github.com/vercel/next.js/blob/canary/examples/with-styled-components/pages/_document.js

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App: any) => (props: any) => sheet.collectStyles(<App {...props} />)
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        styles: [
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ]
      };
    } finally {
      sheet.seal();
      //return Document.getInitialProps(ctx)
    }
  }

  render() {
    return (
      <Html>
        <Head>
          <link href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=optional' rel='stylesheet' key='google-font' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
