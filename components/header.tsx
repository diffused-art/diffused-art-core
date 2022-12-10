import { useWallet } from '@solana/wallet-adapter-react';
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import React from 'react';
import ClientOnly from './client-only';
import LoginButton from './login-button';
import { signOut, useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();
  const wallet = useWallet();
  return (
    <div className="w-full relative z-50 pb-20">
      <div className="absolute left-3 top-5 space-x-10 text-xl">
        <Link href="/">
          <span className="hover:opacity-70 cursor-pointer">diffused.</span>
        </Link>
        <Link href="/about">
          <span className="hover:opacity-70 cursor-pointer">about.</span>
        </Link>
      </div>
      <ClientOnly>
        <div className="absolute right-3 top-3">
          {wallet.connected ? (
            <div className="flex space-x-2">
              <LoginButton />
              <div onClick={() => (session ? signOut() : null)}>
                <WalletDisconnectButton className="!bg-secondary !text-primary" />
              </div>
            </div>
          ) : (
            <WalletMultiButton className="!bg-secondary !text-primary" />
          )}
        </div>
      </ClientOnly>
    </div>
  );
}
