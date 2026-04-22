/**
 * Create Test User for Jest Tests
 * This script safely creates a test user without running migrations
 * Run: npm run test:create-user
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import crypto from 'crypto';

// Load development environment
config({ path: '.env.development' });

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'test123';

const strToMd5 = (str: string): string => {
    return crypto.createHash('md5').update(str).digest('hex');
};

async function createTestUser() {
    console.log('👤 Creating test user for Jest tests...\n');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // 1. Check if test user already exists
        const existingUser = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [TEST_USER_EMAIL]
        );

        // Hash password with MD5
        const passwordHash = strToMd5(TEST_USER_PASSWORD);

        if (existingUser.rows.length > 0) {
            // Update existing user's password
            await pool.query(
                'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
                [passwordHash, TEST_USER_EMAIL]
            );
            console.log('✅ Test user password updated!');
            console.log(`   ID: ${existingUser.rows[0].id}`);
            console.log(`   Email: ${existingUser.rows[0].email}`);
            console.log('\nYou can run tests now: npm test\n');
            return;
        }

        // 2. Get or create a role for test user
        let roleId;
        const existingRole = await pool.query(
            'SELECT id FROM roles WHERE role_name = $1',
            ['Admin']
        );

        if (existingRole.rows.length > 0) {
            roleId = existingRole.rows[0].id;
            console.log(`✅ Using existing role (ID: ${roleId})`);
        } else {
            const newRole = await pool.query(
                'INSERT INTO roles (role_name) VALUES ($1) RETURNING id',
                ['Admin']
            );
            roleId = newRole.rows[0].id;
            console.log(`✅ Created new role (ID: ${roleId})`);
        }

        // 3. Create test user
        const result = await pool.query(
            `INSERT INTO users (user_name, email, phone_number, password, role_id, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING id, email, user_name`,
            ['testuser', TEST_USER_EMAIL, '+1234567890', passwordHash, roleId, true]
        );

        console.log('✅ Test user created successfully!\n');
        console.log('Test User Details:');
        console.log(`   ID: ${result.rows[0].id}`);
        console.log(`   Email: ${TEST_USER_EMAIL}`);
        console.log(`   Password: ${TEST_USER_PASSWORD}`);
        console.log(`   Username: ${result.rows[0].user_name}`);
        console.log('\n🎉 Ready to run tests: npm test\n');

    } catch (error: any) {
        console.error('❌ Error creating test user:', error.message);
        if (error.code === '23505') {
            console.log('\n💡 Test user might already exist. Try running: npm test\n');
        } else {
            throw error;
        }
    } finally {
        await pool.end();
    }
}

// Run the script
createTestUser()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
