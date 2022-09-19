import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} from '@metaplex-foundation/js';
import { nftStorage } from '@metaplex-foundation/js-plugin-nft-storage';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
const wallet = Keypair.generate();

const fundedWallet = Keypair.fromSecretKey(
  bs58.decode(process.env.FUNDED_WALLET_SECRET_KEY!),
);

export function getReadonlyCli() {
  const connection = new Connection(process.env.RPC_URL_QN!);
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(nftStorage({ token: process.env.NFTSTORAGE_KEY! }));

  return metaplex;
}

export function getWriteCli(RPC_URL = process.env.RPC_URL_QN!) {
  const connection = new Connection(RPC_URL);
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(fundedWallet))
    .use(nftStorage({ token: process.env.NFTSTORAGE_KEY! }));
  return metaplex;
}
