import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim()),
  xaiApiKey: process.env.XAI_API_KEY?.trim() || undefined,
  databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
  isProd: process.env.NODE_ENV === "production",
};
