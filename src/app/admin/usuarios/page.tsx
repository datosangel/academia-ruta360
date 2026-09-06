import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserManager } from "@/components/admin/user-manager";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const session = await auth();
  const { rol } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { enrollments: true, coursesTaught: true } },
    },
  });

  return (
    <UserManager
      currentUserId={session!.user.id}
      initialRole={rol === "ADMIN" || rol === "DOCENTE" || rol === "ALUMNO" ? rol : null}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt.toISOString(),
        // Cursos matriculados si es alumno, o cursos a cargo si es docente.
        courseCount: u.role === "DOCENTE" ? u._count.coursesTaught : u._count.enrollments,
      }))}
    />
  );
}
