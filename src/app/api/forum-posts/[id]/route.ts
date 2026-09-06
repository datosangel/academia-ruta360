import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";

/** El autor del mensaje, o quien administra el curso, puede eliminarlo. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { authorId: true, courseId: true },
  });
  if (!post) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const esAutor = session.user.id === post.authorId;
  const puedeAdministrar = !!(await canManageCourse(post.courseId));

  if (!esAutor && !puedeAdministrar) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.forumPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
