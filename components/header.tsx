import { useWallet } from '@solana/wallet-adapter-react';
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import React from 'react';

export default function Header() {
  const wallet = useWallet();
  return (
    <div className="w-full relative z-50 pb-20">
      <div className='absolute left-3 top-7 space-x-10 text-xl'>
        <Link href='/'><span className='hover:opacity-70 cursor-pointer'>diffused.</span></Link>
        <Link href='/about'><span className='hover:opacity-70 cursor-pointer'>about.</span></Link>
      </div>
      <div className="absolute right-3 top-3">
      {wallet.connected ? (
        <WalletDisconnectButton className="!bg-secondary !text-primary" />
      ) : (
        <WalletMultiButton className="!bg-secondary !text-primary" />
      )}
    </div>
    </div>
  );
}
