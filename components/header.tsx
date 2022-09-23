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
    <div className="absolute w-full top-0">
      <div className='absolute left-3 top-3 space-x-10 text-xl'>
        <Link href='/'><span className='hover:opacity-70 cursor-pointer'>diffused.art</span></Link>
        <Link href='/about'><span className='hover:opacity-70 cursor-pointer'>about.</span></Link>
      </div>
      <div className="absolute right-3 top-3">
      {wallet.connected ? (
        <WalletDisconnectButton className="!bg-slate-400 !text-gray-800" />
      ) : (
        <WalletMultiButton className="!bg-slate-400 !text-gray-800" />
      )}
    </div>
    </div>
  );
}
