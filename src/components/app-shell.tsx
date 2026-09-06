import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarLink } from "@/components/sidebar-link";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import {
  IconAyuda,
  IconCalendario,
  IconCertificado,
  IconChat,
  IconConfiguracion,
  IconCursos,
  IconPortafolio,
  IconTareas,
  IconUsuarios,
} from "@/components/nav-icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactElement;
};

const ICON_CLASS = "h-6 w-6";

/** Sección de cursos propia de cada rol; el resto de la navegación es común. */
const COURSES_HOME: Record<string, string> = {
  ADMIN: "/admin",
  DOCENTE: "/docente",
  ALUMNO: "/alumno",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCENTE: "Docente",
  ALUMNO: "Estudiante",
};

function navFor(role: string): NavItem[] {
  const items: NavItem[] = [
    {
      href: COURSES_HOME[role],
      label: "Cursos",
      icon: <IconCursos className={ICON_CLASS} />,
    },
  ];

  if (role === "ADMIN") {
    items.push({
      href: "/admin/usuarios",
      label: "Usuarios",
      icon: <IconUsuarios className={ICON_CLASS} />,
    });
  }
  if (role === "DOCENTE") {
    items.push({
      href: "/docente/tareas",
      label: "Tareas",
      icon: <IconTareas className={ICON_CLASS} />,
    });
  }
  if (role === "ALUMNO") {
    items.push(
      {
        href: "/alumno/certificados",
        label: "Certificados",
        icon: <IconCertificado className={ICON_CLASS} />,
      },
      {
        href: "/alumno/portafolio",
        label: "Portafolio",
        icon: <IconPortafolio className={ICON_CLASS} />,
      }
    );
  }

  items.push(
    { href: "/chat", label: "Chat", icon: <IconChat className={ICON_CLASS} /> },
    {
      href: "/calendario",
      label: "Calendario",
      icon: <IconCalendario className={ICON_CLASS} />,
    },
    { href: "/ayuda", label: "Ayuda", icon: <IconAyuda className={ICON_CLASS} /> },
    {
      href: "/perfil",
      label: "Configuración",
      icon: <IconConfiguracion className={ICON_CLASS} />,
    }
  );

  return items;
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session!.user.role;

  const [user, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { name: true, avatarUrl: true },
    }),
    prisma.notification.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Nombre corto para el saludo. Si empieza con un título ("Dra.", "Lic."...)
  // se incluye la siguiente palabra, para no saludar con «Hola, Dra.».
  const partes = (user?.name ?? "").split(" ").filter(Boolean);
  const firstName = partes[0]?.endsWith(".")
    ? partes.slice(0, 2).join(" ")
    : (partes[0] ?? "");

  return (
    <div className="flex min-h-screen bg-[#eef4fd]">
      {/* ---------- Barra lateral de iconos ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col bg-[#0b1b3a] sm:w-[88px]">
        <div className="flex h-16 items-center justify-center border-b border-white/10">
          <Link
            href={COURSES_HOME[role]}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white"
          >
            <Image
              src="/logo-academia-ruta360.jpg"
              alt="Academia Ruta 360"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col py-2">
          {navFor(role).map((item) => (
            <SidebarLink key={item.href} href={item.href} label={item.label}>
              {item.icon}
            </SidebarLink>
          ))}
        </nav>
      </aside>

      {/* ---------- Contenido ---------- */}
      <div className="flex min-h-screen flex-1 flex-col pl-[72px] sm:pl-[88px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-5 border-b border-slate-200 bg-white px-4 sm:px-8">
          <NotificationBell
            initial={notifications.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              link: n.link,
              readAt: n.readAt?.toISOString() ?? null,
              createdAt: n.createdAt.toISOString(),
            }))}
          />

          <div className="h-8 w-px bg-slate-200" />

          <UserMenu
            name={user?.name ?? ""}
            firstName={firstName}
            roleLabel={ROLE_LABEL[role]}
            avatarUrl={user?.avatarUrl ?? null}
          />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
