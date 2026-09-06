import Image from "next/image";

/**
 * Composición de dos paneles usada por las pantallas de acceso:
 * a la izquierda el hero de marca, a la derecha la tarjeta con el formulario.
 */
export function AuthShell({
  badge,
  headlineTop,
  headlineBottom,
  children,
}: {
  badge: string;
  headlineTop: string;
  headlineBottom: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white lg:flex-row">
      {/* ---------- Panel izquierdo: hero de marca ---------- */}
      <section className="relative flex h-[280px] shrink-0 items-end overflow-hidden sm:h-[340px] lg:h-auto lg:min-h-screen lg:w-[55%]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#032863] via-[#013C9A] to-[#01213f]" />
        <div className="blob blob-a absolute -left-24 -top-16 h-72 w-72 rounded-full bg-[#0a56b8]/50 blur-3xl" />
        <div className="blob blob-b absolute right-[-4rem] top-1/3 h-80 w-80 rounded-full bg-[#3BB546]/30 blur-3xl" />
        <div className="blob blob-c absolute bottom-[-5rem] left-1/4 h-72 w-72 rounded-full bg-[#4bc954]/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] opacity-40 [background-size:22px_22px]" />

        <div className="relative z-10 w-full px-8 pb-10 sm:px-10 sm:pb-12 lg:px-12 lg:pb-16">
          <div className="entry entry-badge inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-black/40 px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,.18),0_6px_18px_rgba(0,0,0,.14)] backdrop-blur">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#fff" />
            </svg>
            {badge}
          </div>

          <h2 className="entry entry-hl1 mt-5 text-[38px] font-bold leading-[0.98] tracking-tight text-white sm:text-[52px] lg:text-[64px]">
            {headlineTop}
          </h2>
          <h2 className="entry entry-hl2 text-[38px] font-bold leading-[0.98] tracking-tight text-white sm:text-[52px] lg:text-[64px]">
            {headlineBottom}
          </h2>
        </div>
      </section>

      {/* ---------- Panel derecho: tarjeta del formulario ---------- */}
      <section className="relative flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-16">
        <div className="entry entry-card -mt-8 w-full max-w-[420px] rounded-3xl border border-black/[0.04] bg-white/90 p-8 shadow-[1px_10px_14px_rgba(10,14,20,0.14),0_1px_3px_rgba(10,14,20,0.05)] backdrop-blur sm:mt-0 sm:p-10">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo-academia-ruta360.jpg"
              alt="Academia Ruta 360"
              width={120}
              height={120}
              priority
              className="h-[120px] w-[120px] object-contain"
            />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

/** Campo de texto con el estilo de las pantallas de acceso. */
export function AuthInput({
  variant = "outlined",
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: "outlined" | "filled";
}) {
  const base =
    "h-[52px] w-full rounded-xl px-4 text-[15px] text-slate-800 placeholder:text-[#909090] transition focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const skin =
    variant === "outlined"
      ? "border border-[#acacae] bg-[#fafafa] focus:border-indigo-500"
      : "border-0 bg-[#f9f9f9] shadow-[inset_0_0_0_1.5px_rgba(172,172,174,0.4)]";

  return <input className={`${base} ${skin} ${className}`} {...props} />;
}

/** Botón principal con flecha, en pill oscuro. */
export function AuthSubmitButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className="entry entry-btn group flex h-[56px] w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#0a56b8] to-[#013C9A] text-[15px] font-medium tracking-tight text-white shadow-[0_8px_20px_rgba(1,60,154,.22),0_2px_5px_rgba(1,60,154,.12)] transition hover:brightness-110 active:translate-y-px disabled:opacity-60"
      {...props}
    >
      {children}
      <svg
        viewBox="0 0 22 22"
        width="15"
        height="15"
        fill="none"
        className="transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        <path
          d="M3 11h15.4M11 3.3l7.7 7.7-7.7 7.7"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/** Divisor "O" entre el formulario y los accesos externos. */
export function AuthDivider() {
  return (
    <div className="entry entry-divider my-6 flex items-center justify-center gap-3">
      <i className="h-[1.5px] flex-[0_0_40%] bg-[#b1b1b2]" />
      <b className="text-[11px] font-bold tracking-wider text-[#5a5a5b]">O</b>
      <i className="h-[1.5px] flex-[0_0_40%] bg-[#b1b1b2]" />
    </div>
  );
}

/** Botón de Google (aún sin OAuth configurado). */
export function GoogleButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="entry entry-google flex h-[54px] w-full items-center justify-center gap-3 rounded-full border border-[#c8c8ca] bg-white/90 text-[15px] text-[#232424] shadow-sm transition hover:bg-white hover:shadow active:translate-y-px"
    >
      <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.4 0 5.7 1.5 7 2.7l5.1-5C33 4 29 2 24 2 14.8 2 7.1 7.5 3.7 15.3l5.9 4.6C11.2 13.9 17 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12.9c-.3 2.2-1.7 5.4-4.9 7.6l5.7 4.4c3.4-3.1 5.8-7.8 5.8-15.6z"
        />
        <path
          fill="#FBBC05"
          d="M9.6 19.9c-.4 1.2-.7 2.6-.7 4.1s.3 2.9.7 4.1l-5.9 4.6C2.4 30 2 27.1 2 24s.4-6 1.7-8.7z"
        />
        <path
          fill="#34A853"
          d="M24 46c5 0 9.2-1.7 12.2-4.5l-5.7-4.4c-1.6 1.1-3.7 1.8-6.5 1.8-7 0-12.8-4.4-14.4-10.4l-5.9 4.6C7.1 40.5 14.8 46 24 46z"
        />
      </svg>
      {label}
    </button>
  );
}
