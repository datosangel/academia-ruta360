"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconCampana } from "@/components/nav-icons";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
};

const TYPE_ICON: Record<string, string> = {
  ANUNCIO: "📣",
  TAREA: "📝",
  CALIFICACION: "🏆",
  MENSAJE: "💬",
  CLASE: "🎥",
};

export function NotificationBell({
  initial,
}: {
  initial: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.readAt).length;

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications);
      }
    }
  };

  const marcarTodasLeidas = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    await fetch("/api/notifications", { method: "PATCH" });
  };

  const abrir = async (n: Notification) => {
    if (!n.readAt) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
      );
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={`Notificaciones${unread > 0 ? `: ${unread} sin leer` : ""}`}
        className="relative text-slate-500 transition hover:text-indigo-600"
      >
        <IconCampana className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold">Notificaciones</p>
            {unread > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                No tienes notificaciones.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const contenido = (
                    <>
                      <span className="text-base leading-none">
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {n.body}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      {!n.readAt && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                      )}
                    </>
                  );

                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => abrir(n)}
                          className={`flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                            !n.readAt ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          {contenido}
                        </Link>
                      ) : (
                        <button
                          onClick={() => abrir(n)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                            !n.readAt ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          {contenido}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
