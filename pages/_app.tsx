import '../styles/globals.css';
import type { AppProps } from 'next/app';

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import React, { useMemo } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Amplify } from "aws-amplify";
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

import awsExports from "../src/aws-exports";
Amplify.configure({ ...awsExports, ssr: true });

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_URL!, []);

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
    ],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SessionProvider session={session}>
            <Component {...pageProps} />
          </SessionProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
