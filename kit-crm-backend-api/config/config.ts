import dotenv from 'dotenv';
import fs from 'fs';
import { Config } from '../app/types/config.types';

const NODE_ENV = process.env.NODE_ENV || 'development';
const baseEnv = '.env';
const envFile = `.env.${NODE_ENV}`;

// Load base .env if present (do not overwrite existing env vars)
if (fs.existsSync(baseEnv)) {
  dotenv.config({ path: baseEnv });
} else {
  dotenv.config();
}

// If an environment-specific file exists, parse it and assign values to process.env
// This forces environment-specific values to overwrite base values.
if (fs.existsSync(envFile)) {
  const envConfig = dotenv.parse(fs.readFileSync(envFile));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const config: Config = {
  NODE_ENV,
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'changeme',
};

export default config;
