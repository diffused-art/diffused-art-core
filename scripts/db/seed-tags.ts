import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const keywords = [
  'Monet',
  'Oil painting',
  'Drawing',
  'Watercolor',
  'Impressionism',
  'Abstract',
  'Pop art',
  'Expressionism',
  'Realism',
  'Surrealism',
  'Pointillism',
  'Fauvism',
  'Cubism',
  'Futurism',
  'Abstract expressionism',
  'Neo-impressionism',
  'Art nouveau',
  'Baroque',
  'Gothic',
  'Renaissance',
  'Rococo',
  'Romanticism',
  'Modern art',
  'Postmodern art',
  'Street art',
  'Graffiti',
  'Digital art',
  '3D art',
  'Landscape',
  'Portrait',
  'Still life',
  'Figurative',
  'Non-figurative',
  "Trompe-l'œil",
  'Photorealism',
  'Hyperrealism',
  'Minimalism',
  'Conceptual art',
  'Installation art',
  'Performance art',
  'Video art',
  'Mixed media',
  'Collage',
  'Assemblage',
  'Textile art',
  'Printmaking',
  'Photography',
  'Filmmaking',
  'Concept art',
  'Game art',
  'Michelangelo',
  'Leonardo da Vinci',
  'Vincent van Gogh',
  'Rembrandt',
  'Pablo Picasso',
  'Frida Kahlo',
  'Henri Matisse',
  'Salvador Dali',
  'Edvard Munch',
  'Gustav Klimt',
  'Egon Schiele',
  'Amedeo Modigliani',
  'Marc Chagall',
  'Rene Magritte',
  "Georgia O'Keeffe",
  'Johannes Vermeer',
  'Jan van Eyck',
  'Caravaggio',
  'Sandro Botticelli',
  'Diego Rivera',
  'Albrecht Dürer',
  'Japanese anime',
  'Computer animation',
  'American animation',
  'American computer animation',
];

(async function seedTags() {
  console.info('Creating/seeding tags...');
  await prisma.tag.createMany({
    data: keywords.map(data => ({
      label: data,
      isEnabled: true,
    })),
  });
  console.info('Create successful...');
})()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
