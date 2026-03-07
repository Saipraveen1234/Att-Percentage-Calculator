import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendance.findMany({
    where: {
      date: {
        gte: new Date('2026-02-28'),
        lte: new Date('2026-03-31')
      }
    }
  });
  console.log(records);
}
main();
