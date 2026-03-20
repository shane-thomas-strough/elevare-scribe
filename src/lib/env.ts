import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_R2_BASE: z.string().url("NEXT_PUBLIC_R2_BASE must be a valid URL"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_R2_BASE: process.env.NEXT_PUBLIC_R2_BASE,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!result.success) {
    console.error("Environment validation failed:", result.error.format());
    // Don't crash in production — log and continue with degraded state
    return {
      NEXT_PUBLIC_R2_BASE: process.env.NEXT_PUBLIC_R2_BASE ?? "",
    };
  }

  return result.data;
}
