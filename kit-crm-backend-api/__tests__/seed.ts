/**
 * Test Database Seeder
 * Creates necessary test data for running Jest integration tests
 * 
 * Usage: npm run seed:test
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

// Load test environment
config({ path: '.env.test' });

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'test123';
const TEST_ROLE_NAME = 'Test Admin';

async function seedTestData() {
    console.log('🌱 Starting test database seeding...');
    
    // Create database connection
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool);

    try {
        // 1. Create or get test role
        console.log('📝 Creating test role...');
        
        const existingRole = await db
            .select()
            .from(schema.roles)
            .where(eq(schema.roles.roleName, TEST_ROLE_NAME))
            .limit(1);

        let roleId: number;

        if (existingRole.length > 0) {
            roleId = existingRole[0].id;
            console.log(`✅ Test role already exists (ID: ${roleId})`);
        } else {
            const [newRole] = await db
                .insert(schema.roles)
                .values({
                    roleName: TEST_ROLE_NAME,
                })
                .returning({ id: schema.roles.id });
            
            roleId = newRole.id;
            console.log(`✅ Created test role (ID: ${roleId})`);
        }

        // 2. Create or update test user
        console.log('👤 Creating test user...');
        
        // NOTE: For actual password hashing, you would need to install bcryptjs
        // and use: bcrypt.hashSync(TEST_USER_PASSWORD, 10)
        // For now, this is a placeholder that needs to be replaced
        const passwordHash = '$2a$10$YourHashedPasswordHere'; // REPLACE WITH ACTUAL HASH

        const existingUser = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, TEST_USER_EMAIL))
            .limit(1);

        if (existingUser.length > 0) {
            // Update existing user
            await db
                .update(schema.users)
                .set({
                    password: passwordHash,
                    roleId: roleId,
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(schema.users.email, TEST_USER_EMAIL));
            
            console.log(`✅ Updated test user: ${TEST_USER_EMAIL}`);
        } else {
            // Create new user
            await db
                .insert(schema.users)
                .values({
                    userName: 'testuser',
                    email: TEST_USER_EMAIL,
                    phoneNumber: '+1234567890',
                    password: passwordHash,
                    firstName: 'Test',
                    lastName: 'User',
                    roleId: roleId,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            
            console.log(`✅ Created test user: ${TEST_USER_EMAIL}`);
        }

        // 3. Verify test data
        console.log('🔍 Verifying test data...');
        
        const testUser = await db
            .select({
                id: schema.users.id,
                email: schema.users.email,
                roleId: schema.users.roleId,
                isActive: schema.users.isActive,
            })
            .from(schema.users)
            .where(eq(schema.users.email, TEST_USER_EMAIL))
            .limit(1);

        if (testUser.length > 0) {
            console.log('✅ Test user verified:', testUser[0]);
        }

        console.log('🎉 Test database seeding completed successfully!');
        console.log('');
        console.log('Test credentials:');
        console.log(`  Email: ${TEST_USER_EMAIL}`);
        console.log(`  Password: ${TEST_USER_PASSWORD}`);
        console.log('');
        console.log('⚠️  NOTE: Make sure to replace the placeholder password hash');
        console.log('   with an actual bcrypt hash in this script!');

    } catch (error) {
        console.error('❌ Error seeding test database:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the seeder
seedTestData()
    .then(() => {
        console.log('✨ Seeding process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
