import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1d'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuration des variables d\'environnement invalide:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
