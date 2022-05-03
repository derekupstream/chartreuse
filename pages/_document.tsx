/* eslint-disable react/display-name */
import Document, { Html, Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'
import * as React from 'react'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App: any) => (props: any) => sheet.collectStyles(<App {...props} />),
        })

      const initialProps = await Document.getInitialProps(ctx)

      return {
        ...initialProps,
        styles: [
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>,
        ],
      }
    } catch (err) {
      sheet.seal()
      return Document.getInitialProps(ctx)
    }
  }

  render() {
    return (
      <Html>
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=optional" rel="stylesheet" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
