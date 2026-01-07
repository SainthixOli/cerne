import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const profiles = await prisma.profile.findMany();
    console.log('--- PROFILES ---');
    console.log(profiles);

    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    console.log(users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
