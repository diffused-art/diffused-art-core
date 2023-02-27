import { revealNFT } from '../../functions/revealNFT';
const env = process.env.NODE_ENV;

export default async function handle(req: any, res: any) {
  if (env == 'development') {
    if (req.method !== 'POST') {
      res.status(405).send({ message: 'Only POST requests allowed' });
      return;
    }
    revealNFT(req.query.mint_address);
    return res.status(200).send({ message: 'OK' });
  } else {
    res.status(404).send({ message: 'Not found' });
    return;
  }
}
