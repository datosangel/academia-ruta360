import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCENTE: "Docente",
  ALUMNO: "Estudiante",
};

export default async function PerfilPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      documentId: true,
      bio: true,
      avatarUrl: true,
      role: true,
    },
  });
  if (!user) notFound();

  return (
    <ProfileForm
      profile={{
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        documentId: user.documentId ?? "",
        bio: user.bio ?? "",
        avatarUrl: user.avatarUrl,
        roleLabel: ROLE_LABEL[user.role],
      }}
    />
  );
}
