import dotenv from 'dotenv';
dotenv.config();

// In production DATABASE_URL is used (Supabase)
// In development individual DB_* vars are used
const usingConnectionString = !!process.env.DATABASE_URL;

const required = [
  'JWT_SECRET',
  'RESEND_API_KEY',
  ...(!usingConnectionString ? ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] : []),
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || null,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};