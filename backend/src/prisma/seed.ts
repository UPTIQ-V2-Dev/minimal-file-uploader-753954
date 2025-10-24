import { PrismaClient, Role } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin',
            password: adminPassword,
            role: Role.ADMIN,
            isEmailVerified: true
        }
    });

    console.log('✅ Created admin user:', admin.email);

    // Create sample file for admin user (for testing purposes)
    const sampleFile = await prisma.file.upsert({
        where: { id: 1 },
        update: {},
        create: {
            filename: 'sample-document.pdf',
            originalName: 'Sample Document.pdf',
            contentType: 'application/pdf',
            size: 1024000,
            signedUrl: 'https://example.com/signed-url-sample',
            userId: admin.id
        }
    });

    console.log('✅ Created sample file:', sampleFile.originalName);
}

main()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
