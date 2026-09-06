"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="mt-2 text-xs font-medium text-slate-500 hover:text-indigo-600"
    >
      Cerrar sesión
    </button>
  );
}
