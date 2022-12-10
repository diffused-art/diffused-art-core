export default function signInMessage(params: {
  nonce: string;
  walletAddress: string;
}): string {
  return `diffused.art wants you to sign in with your Solana account:
  ${params.walletAddress}

  Click Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee. Use of our website and service are subject to our Terms of Service: https://magiceden.io/terms-of-service.pdf and Privacy Policy: https://magiceden.io/privacy-policy.pdf

  URI: https://diffused.art
  Version: 1
  Chain ID: Solana Mainnet
  Nonce: ${params.nonce}`;
}
