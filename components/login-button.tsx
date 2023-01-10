import { useWallet } from '@solana/wallet-adapter-react';
import React, { useState } from 'react';
import signInMessage from '../utils/signInMessage';
import { signIn, useSession } from 'next-auth/react';
import ConnectButton from './connect-button';
const bs58 = require('bs58');

export default function LoginButton() {
  const { signMessage, publicKey, connected } = useWallet();
  const { data: session } = useSession({ required: false });
  const [loading, setLoading] = useState(false);
  async function fetchNonce() {
    const response = await fetch('/api/auth');

    if (response.status != 200) throw new Error('nonce could not be retrieved');

    const { nonce } = await response.json();

    return nonce;
  }

  async function login() {
    setLoading(true);

    if (!publicKey || !signMessage) {
      setLoading(false);
      return;
    }

    const nonce = await fetchNonce();

    const message = signInMessage({
      nonce,
      walletAddress: publicKey.toBase58(),
    });
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await signMessage(encodedMessage).catch(() => false);

    if (!signature) {
      setLoading(false);
      console.debug('User did not sign the message.');
      return;
    }

    const signInResult = await signIn('solana-login', {
      redirect: false,
      publicKey: publicKey.toBase58(),
      signature: bs58.encode(signature),
    });

    if (signInResult?.error) {
      console.debug('Could not authenticate the message', signInResult?.error);
    }

    setLoading(false);
  }

  const btnLabel = session
    ? `Logged in as ${session.user?.name}`
    : 'Login as artist';

  if (!connected)
    return (
      <div>
        <ConnectButton className="!w-full" label="Connect wallet in order to login as artist" />
      </div>
    );
  return (
    <div>
      <button
        className={`rounded-md px-4 h-[40px] bg-main-yellow text-black ${
          loading ? 'opacity-50' : ''
        }`}
        disabled={loading}
        onClick={session ? () => null : login}
      >
        {loading ? 'Loading...' : btnLabel}
      </button>
    </div>
  );
}
