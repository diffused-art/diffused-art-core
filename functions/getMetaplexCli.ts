import {
  Metaplex,
  keypairIdentity,
  MetaplexPlugin,
} from '@metaplex-foundation/js';
import { nftStorage } from '@metaplex-foundation/js-plugin-nft-storage';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
const wallet = Keypair.generate();

export function getReadonlyCli() {
  const connection = new Connection(process.env.RPC_URL_INSERTCM!);
  const identity = Keypair.generate();
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(
      nftStorage({
        identity,
      }) as unknown as MetaplexPlugin,
    );

  return metaplex;
}

export function getWriteCli(RPC_URL = process.env.RPC_URL_INSERTCM!, FUNDED_WALLET_SECRET = process.env.FUNDED_WALLET_SECRET!) {
  const connection = new Connection(RPC_URL);

  const fundedWallet = Keypair.fromSecretKey(
    bs58.decode(FUNDED_WALLET_SECRET),
  );
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(fundedWallet))
    .use(
      nftStorage({
        identity: fundedWallet,
      }) as unknown as MetaplexPlugin,
    );
  return metaplex;
}
