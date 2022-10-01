import prisma from '../../../lib/prisma';

// TODO: Adds API key to gate this service
// TODO: Adds cors
// TODO: Adds bots rate limitting
export default async function handle(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).send({ message: 'Only GET requests allowed' });
    return;
  }

  const { address } = req.query;
  const result = await prisma.mint.findUnique({
    where: { mint_address: address },
  });

  if (!result) {
    return res.status(404).json({ message: 'Not found.' });
  }
  return res.status(200).json({ data: result });
}
