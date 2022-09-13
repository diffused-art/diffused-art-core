import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from 'bs58';
const connection = new Connection(process.env.RPC_URL!);
const wallet = Keypair.generate();

const fundedWallet = Keypair.fromSecretKey(bs58.decode(process.env.FUNDED_WALLET_SECRET_KEY!));

export function getReadonlyCli() {
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage());
  return metaplex;
}

export function getWriteCli() {
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(fundedWallet))
    .use(bundlrStorage());
  return metaplex;
}