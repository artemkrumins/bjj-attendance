import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111111" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
