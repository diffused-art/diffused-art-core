import { revealNFT } from '../../../../functions/revealNFT';

// TODO: Adds API key to gate this service
// TODO: Adds cors
// TODO: Adds bots rate limitting
export default async function handle(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' })
    return
  }

  const { address } = req.query;
  const result = await revealNFT(address);

  return res.status(result.status).json({ message: result.message });
}
