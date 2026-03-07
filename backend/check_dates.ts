import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendance.findMany({
    where: {
      classId: 7 // Or whatever class ID Life Sciences is
    },
    take: 10,
    orderBy: { date: 'desc' },
    select: { date: true, classId: true }
  });
  console.log(records);
}
main();
