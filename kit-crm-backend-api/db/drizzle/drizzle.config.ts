import '../../config/config';

import type { Config } from 'drizzle-kit';

export default {
    schema: './db/schema.ts',
    out: './db/drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        ssl: {
            rejectUnauthorized: false
        }
    }
} satisfies Config;
