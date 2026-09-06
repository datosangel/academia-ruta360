import { notFound } from "next/navigation";
import { loadUserProfile } from "@/lib/user-profile";
import { UserProfile } from "@/components/admin/user-profile";

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const data = await loadUserProfile(userId);
  if (!data) notFound();

  return <UserProfile data={data} backHref="/admin/usuarios" />;
}
