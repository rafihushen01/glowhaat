import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ecfdf5,_#d1fae5_35%,_#ffffff_75%)] px-6 py-12">
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-emerald-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-emerald-300/60 blur-3xl" />

      <section className="relative w-full max-w-xl rounded-3xl border border-emerald-200/70 bg-white/90 p-8 text-center shadow-[0_30px_80px_rgba(16,185,129,0.18)] backdrop-blur-sm md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Glow Haat
        </p>

        <h1 className="mt-4 text-6xl font-black leading-none text-emerald-700 md:text-7xl">
          404
        </h1>

        <p className="mt-4 text-2xl font-bold text-[var(--kc-text)]">
          Looks like this page is missing
        </p>

        <p className="mx-auto mt-3 max-w-md text-base text-[var(--kc-muted)]">
          No worries, you are not stuck. Head back home and keep exploring
          your beauty favorites.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 smooth-hover emerald-glow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Take Me Home
          </Link>
        </div>
      </section>
    </main>
  );
}

