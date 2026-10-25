// Violation de contrainte d'unicité PostgreSQL (code 23505), directe ou enveloppée par Drizzle
export const isUniqueViolation = (e: unknown) =>
  (e as { code?: string })?.code === "23505" || (e as { cause?: { code?: string } })?.cause?.code === "23505";
