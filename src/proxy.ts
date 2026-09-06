import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const roleHome: Record<string, string> = {
  ADMIN: "/admin",
  DOCENTE: "/docente",
  ALUMNO: "/alumno",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;
  const role = req.auth?.user?.role;

  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname === "/recuperar-password" ||
    // Verificación pública de certificados: no requiere sesión.
    pathname.startsWith("/validar/") ||
    pathname.startsWith("/api/auth");

  if (isPublic) return NextResponse.next();

  if (!isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const protectedPrefixes: Record<string, string> = {
    "/admin": "ADMIN",
    "/docente": "DOCENTE",
    "/alumno": "ALUMNO",
  };

  for (const [prefix, requiredRole] of Object.entries(protectedPrefixes)) {
    if (pathname.startsWith(prefix) && role !== requiredRole) {
      const url = req.nextUrl.clone();
      url.pathname = roleHome[role ?? ""] ?? "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|avif)$).*)",
  ],
};
