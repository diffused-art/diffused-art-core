import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

(async function flush() {
    const models = Object.keys(prisma).filter((key) => key[0] !== "_");

    const promises = models.map((name) => {
        return (prisma as any)[name].deleteMany();
    });

    await Promise.all(promises);
})();