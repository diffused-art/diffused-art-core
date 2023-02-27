import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { GoogleAnalytics, event } from 'nextjs-google-analytics';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  BackpackWalletAdapter,
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import React, { useMemo } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import NextNProgress from 'nextjs-progressbar';

require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

const queryClient = new QueryClient();

export function reportWebVitals({ id, name, label, value }) {
  event(name, {
    category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    label: id,
    nonInteraction: true,
  });
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_URL!, []);

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new BackpackWalletAdapter()
    ],
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <SessionProvider session={session} refetchInterval={4 * 60}>
              <GoogleAnalytics
                trackPageViews
                gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
              />
              <NextNProgress color='#FFC700' />
              <Component {...pageProps} />
            </SessionProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
