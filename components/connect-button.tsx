import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { signOut } from 'next-auth/react';
import cns from 'classnames';

interface ConnectButtonProps {
  label?: string;
  className?: string;
}

export default function ConnectButton({
  label = 'Connect wallet',
  className = '',
}: ConnectButtonProps) {
  const wallet = useWallet();
  const walletModel = useWalletModal();
  return (
    <button
      aria-label="connect wallet"
      className={cns(
        `w-[180px] rounded-md px-4 min-h-[40px] h-full bg-main-yellow text-black truncate`,
        className,
      )}
      onClick={() => {
        if (wallet.connected) {
          if (confirm('Are you sure you want to disconnect?')) {
            wallet.disconnect();
            signOut({ redirect: false });
          }
        } else {
          walletModel.setVisible(true);
        }
      }}
    >
      {wallet.connected ? (
        <div className="flex flex-col">
          <span>Connected</span>
          <span className="truncate">{wallet.publicKey?.toString()}</span>
        </div>
      ) : (
        label
      )}
    </button>
  );
}
