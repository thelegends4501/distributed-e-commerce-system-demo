import { db } from '@/db';
import { user, account } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const sampleUsers = [
        {
            id: 'user_vip1',
            name: 'Sarah Chen',
            email: 'vip1@techstore.com',
            emailVerified: true,
            image: null,
            isVip: true,
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
        },
        {
            id: 'user_vip2',
            name: 'Michael Rodriguez',
            email: 'vip2@techstore.com',
            emailVerified: true,
            image: null,
            isVip: true,
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-12'),
        },
        {
            id: 'user_vip3',
            name: 'Emma Thompson',
            email: 'vip3@techstore.com',
            emailVerified: true,
            image: null,
            isVip: true,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
        },
        {
            id: 'user_vip4',
            name: 'David Kim',
            email: 'vip4@techstore.com',
            emailVerified: true,
            image: null,
            isVip: true,
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-18'),
        },
        {
            id: 'user_vip5',
            name: 'Olivia Johnson',
            email: 'vip5@techstore.com',
            emailVerified: true,
            image: null,
            isVip: true,
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-20'),
        },
    ];

    const hashedPassword = bcrypt.hashSync('vippass123', 10);

    const sampleAccounts = [
        {
            id: 'account_vip1',
            accountId: 'vip1@techstore.com',
            providerId: 'credential',
            userId: 'user_vip1',
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
        },
        {
            id: 'account_vip2',
            accountId: 'vip2@techstore.com',
            providerId: 'credential',
            userId: 'user_vip2',
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-12'),
        },
        {
            id: 'account_vip3',
            accountId: 'vip3@techstore.com',
            providerId: 'credential',
            userId: 'user_vip3',
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
        },
        {
            id: 'account_vip4',
            accountId: 'vip4@techstore.com',
            providerId: 'credential',
            userId: 'user_vip4',
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-18'),
        },
        {
            id: 'account_vip5',
            accountId: 'vip5@techstore.com',
            providerId: 'credential',
            userId: 'user_vip5',
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-20'),
        },
    ];

    await db.insert(user).values(sampleUsers);
    await db.insert(account).values(sampleAccounts);
    
    console.log('✅ VIP users and accounts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});