import NextAuth, { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
const nacl = require('tweetnacl');
const bs58 = require('bs58');
import prisma from '../../../lib/prisma';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../middlewares/applyRateLimit';
import signInMessage from '../../../utils/signInMessage';

const middlewares = getRateLimitMiddlewares();

export default async function auth(req: any, res: any) {
  try {
    await applyRateLimit(req, res, middlewares);
  } catch {
    return res.status(429).send('Too Many Requests');
  }

  const providers = [
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
          walletAddress: artist.walletAddress,
        } as {
          email: string;
          username: string;
          name: string;
          walletAddress: string;
        } & User;

        await prisma.nonceTrashBin.update({
          where: {
            nonce,
          },
          data: {
            used: true,
          },
        });

        return user;
      },
    }),
  ];

  return await NextAuth(req, res, {
    secret: process.env.NEXTAUTH_SECRET,
    providers,
    callbacks: {
      async jwt({ token, account, user }) {
        if (account) {
          token.accessToken = account.access_token;
        }
        if (user) {
          token.name = user.name;
          token.email = user.email;
          token.username = (user as any).username;
          token.walletAddress = (user as any).walletAddress;
        }
        return token;
      },
      session: async ({ session, token, ...rest }) => {
        if (token.username) {
          session.user.name = token.name as string;
          session.user.username = token.username as string;
          session.user.email = token.email as string;
          session.user.walletAddress = token.walletAddress as string;
        }

        return session;
      },
    },
  });
}
