import { AppShell } from "@/components/app-shell";

export default function AlumnoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
