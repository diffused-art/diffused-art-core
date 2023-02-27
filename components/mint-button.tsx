import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCallback } from 'react';

interface MintButtonProps {
  onMint: () => void;
  isLoading: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export default function MintButton({
  onMint,
  isLoading = false,
  textColor,
  backgroundColor,
}: MintButtonProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const mintFunc = useCallback(async () => {
    if (connected) {
      await onMint();
    } else {
      setVisible(true);
    }
  }, [setVisible, onMint, connected]);

  return (
    <button
      className={`rounded-lg py-2 px-10 bg-main-yellow text-black ${
        isLoading ? 'opacity-50' : ''
      }`}
      style={{
        backgroundColor,
        color: textColor,
      }}
      onClick={mintFunc}
      disabled={isLoading}
    >
      {isLoading ? 'Minting, confirm on your wallet...' : 'Mint'}
    </button>
  );
}
