import NextAuth, { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
const nacl = require('tweetnacl');
const bs58 = require('bs58');
import prisma from '../../../lib/prisma';
import signInMessage from '../../../utils/signInMessage';

const nextAuthOptions = req => {
  return {
    providers: [
      CredentialsProvider({
        id: 'solana-login',
        name: 'Login with Solana',
        credentials: {
          publicKey: { label: 'Public Key', type: 'password' },
          signature: { label: 'Signature', type: 'password' },
        },
        authorize: async credentials => {
          if (!credentials?.publicKey || !credentials?.signature) {
            console.error(`Credentials not informed`);
            throw new Error('credentials invalid');
          }
          const nonce = req.cookies['auth-nonce'];

          const nonceAlreadyUsed = await prisma.nonceTrashBin.findFirst({
            where: {
              nonce,
              used: true,
            },
          });

          if (nonceAlreadyUsed) {
            console.error(`nonce expired/used`);
            throw new Error('nonce expired or already used');
          }

          const message = signInMessage({
            nonce,
            walletAddress: credentials.publicKey,
          });
          const messageBytes = new TextEncoder().encode(message);

          const publicKeyBytes = bs58.decode(credentials.publicKey);
          const signatureBytes = bs58.decode(credentials.signature);

          const result = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes,
          );

          if (!result) {
            console.error(`authentication failed`);
            throw new Error('user can not be authenticated');
          }

          const artist = await prisma.artist.findFirst({
            where: {
              walletAddress: credentials.publicKey,
            },
          });

          if (!artist) {
            console.error(`artist not found`);
            throw new Error('user can not be authenticated');
          }

          const user = {
            name: artist.name,
            email: artist.email,
            username: artist.username,
            id: artist.id,
          } as User;

          await prisma.nonceTrashBin.create({
            data: {
              nonce,
              used: true,
            },
          });

          return user;
        },
      }),
    ],
  };
};

const route = (req, res) => {
  return NextAuth(req, res, nextAuthOptions(req));
};

export default route;
