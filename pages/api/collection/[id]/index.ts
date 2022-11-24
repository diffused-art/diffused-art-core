import prisma from '../../../../lib/prisma';

export default async function handle(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).send({ message: 'Only GET requests allowed' });
    return;
  }
  const collection = await prisma.collection.findUnique({
    where: { id: req.query.id },
  });
  if (!collection) {
    return res.status(404).json({ message: 'Not found.' });
  }

  switch (req.method) {
    case 'GET': {
      return res.status(200).json({ data: collection });
    }
    case 'PUT': {
      // TODO: Update preview image once there is a trust less mechanism for creating collections
      return res.status(200).json({ data: collection });
    }
    default:
      return res.status(404).json({ message: 'Not found.' });
  }
}
