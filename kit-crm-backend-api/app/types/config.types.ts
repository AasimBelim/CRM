// Configuration types
export interface Config {
  NODE_ENV: string;
  PORT: number | string;
  DB_URL: string;
  FRONTEND_URL: string;
  JWT_SECRET_KEY: string;
}

export interface CorsConfig {
  origin: string | string[];
  methods: string;
  allowedHeaders: string;
  credentials: boolean;
  maxAge: number;
}
