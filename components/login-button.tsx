import { useWallet } from '@solana/wallet-adapter-react';
import React from 'react';
import signInMessage from '../utils/signInMessage';
import { signIn, useSession } from 'next-auth/react';
const bs58 = require('bs58');

export default function LoginButton() {
  const { signMessage, publicKey } = useWallet();
  // TODO: Check if username fields are available here.. If so, add a type for this.
  const { data: session, status } = useSession();

  async function fetchNonce() {
    const response = await fetch('/api/auth');

    if (response.status != 200) throw new Error('nonce could not be retrieved');

    const { nonce } = await response.json();

    return nonce;
  }

  async function login() {
    if (!publicKey || !signMessage) {
      return;
    }

    const nonce = await fetchNonce();

    const message = signInMessage({
      nonce,
      walletAddress: publicKey.toBase58(),
    });
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await signMessage(encodedMessage);

    const signInResult = await signIn('credentials', {
      publicKey: publicKey.toBase58(),
      signature: bs58.encode(signature),
      callbackUrl: `${window.location.origin}/`,
    });

    if (!signInResult?.ok) {
      console.error(
        'User did not sign or there was a server error',
        signInResult?.error,
      );
    }
  }

  return (
    <div>
      <button
        className={`flex justify-center items-center rounded-md p-5 bg-secondary text-primary font-bold h-12 ${
          status === 'loading' ? 'opacity-50' : ''
        }`}
        disabled={status === 'loading'}
        onClick={session ? () => null : login}
      >
        {session
          ? `Logged in as ${session.user?.name}`
          : 'Click to login as an artist'}
      </button>
    </div>
  );
}
