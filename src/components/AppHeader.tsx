import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="relative z-10 mx-auto grid w-full max-w-6xl shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-6">
      <Link to="/" className="flex min-w-0 items-center gap-2.5">
        <img
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
          className="size-8 shrink-0 select-none"
          draggable={false}
        />
        <span className="truncate text-lg font-bold tracking-tight">KruFace</span>
      </Link>
      <nav className="glass flex items-center gap-1 rounded-full p-1 ring-1 ring-border">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-ink text-primary-foreground" }}
          inactiveProps={{ className: "text-foreground/55 hover:text-foreground" }}
          className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
        >
          Practice
        </Link>
        <Link
          to="/people"
          activeProps={{ className: "bg-ink text-primary-foreground" }}
          inactiveProps={{ className: "text-foreground/55 hover:text-foreground" }}
          className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
        >
          People
        </Link>
      </nav>
    </header>
  );
}
