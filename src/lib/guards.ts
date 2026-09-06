import { auth } from "@/lib/auth";

export type Role = "ADMIN" | "DOCENTE" | "ALUMNO";

/**
 * Devuelve la sesión si el usuario tiene alguno de los roles indicados.
 * Si no, devuelve null para que la ruta responda 401/403.
 */
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) return null;
  if (!roles.includes(session.user.role as Role)) return null;
  return session;
}
