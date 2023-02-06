import prisma from '../../../lib/prisma';

export default async function handle(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).send({ message: 'Only GET requests allowed' });
    return;
  }
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { CollectionTag: true },
      },
    },
    where: {
      isEnabled: true,
    },
    orderBy: {
      label: 'asc',
    }
  });

  return res.status(200).json({ data: tags });
}
