import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('123456', salt); // Default password for all

    // 1. Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: 'super@cerne.com' },
        update: {},
        create: {
            email: 'super@cerne.com',
            name: 'Super Admin Chefe',
            password: password,
            role: 'super_admin',
            profile: {
                create: {
                    cpf: '000.000.000-00',
                    phone: '11999999999'
                }
            }
        },
    });

    // 2. Admin Padrão
    const admin = await prisma.user.upsert({
        where: { email: 'admin@cerne.com' },
        update: {},
        create: {
            email: 'admin@cerne.com',
            name: 'Admin Padrão',
            password: password,
            role: 'admin',
            profile: {
                create: {
                    cpf: '111.111.111-11',
                    phone: '11888888888'
                }
            }
        },
    });

    // 3. Admin Técnico (Tech)
    const techAdmin = await prisma.user.upsert({
        where: { email: 'tech@cerne.com' },
        update: {},
        create: {
            email: 'tech@cerne.com',
            name: 'Admin Técnico',
            password: password, // You might want a stronger one
            role: 'tech_admin', // Using generic string
            profile: {
                create: {
                    cpf: '222.222.222-22',
                    phone: '11777777777'
                }
            }
        },
    });

    // 4. Membro Filiado (Member)
    const member = await prisma.user.upsert({
        where: { email: 'member@cerne.com' },
        update: {},
        create: {
            email: 'member@cerne.com',
            name: 'João Filiado',
            password: password,
            role: 'user',
            profile: {
                create: {
                    cpf: '333.333.333-33',
                    phone: '11666666666',
                    city: 'São Paulo',
                    state: 'SP'
                }
            },
            affiliations: {
                create: {
                    status: 'approved',
                    requestDate: new Date(),
                    approvalDate: new Date(),
                }
            }
        },
    });

    console.log({ superAdmin, admin, techAdmin, member });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
