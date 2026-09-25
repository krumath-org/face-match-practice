import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { GlowBackground } from "@/components/GlowBackground";
import { usePeople } from "@/hooks/use-people";
import { accuracy } from "@/lib/people-store";
import { MIN_PEOPLE } from "@/lib/quiz";
import heroPortrait from "@/assets/hero-portrait.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KruFace — Practice names and faces" },
      {
        name: "description",
        content: "See a face, pick the name. A quiet drill for the people you keep mixing up.",
      },
      { property: "og:title", content: "KruFace — Practice names and faces" },
      {
        property: "og:description",
        content: "See a face, pick the name. A quiet drill for the people you keep mixing up.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { people, stats, loaded } = usePeople();
  const acc = accuracy(stats);
  const ready = people.length >= MIN_PEOPLE;
  const latest = people[people.length - 1];

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-mist text-ink">
      <GlowBackground />
      <AppHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pb-5 sm:px-6">
        <section className="fade-up grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] items-center gap-5 lg:grid-cols-[1.25fr_.75fr] lg:grid-rows-1 lg:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ring-border">
              <span className={`size-2 rounded-full ${ready ? "bg-accent" : "bg-foreground/25"}`} />
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/60">
                {!loaded
                  ? "Loading"
                  : ready
                    ? "Ready to practice"
                    : `${Math.max(0, MIN_PEOPLE - people.length)} more to start`}
              </span>
            </div>

            <h1 className="max-w-[24ch] text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              See the face. Name the person.
            </h1>

            <p className="max-w-[42ch] text-sm text-foreground/60 text-pretty sm:text-base">
              A quiet drill for the faces you keep mixing up. One portrait at a time.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {ready ? (
                <Link
                  to="/quiz"
                  className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40"
                >
                  <Play className="size-4" />
                  Start practice
                </Link>
              ) : (
                <Link
                  to="/people/add"
                  className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40"
                >
                  <Users className="size-4" />
                  Add people
                </Link>
              )}

              <div className="glass flex items-center gap-3 rounded-full px-4 py-2.5 ring-1 ring-border">
                <span className="text-sm font-semibold">{acc === null ? "—" : `${acc}%`}</span>
                <span className="h-4 w-px bg-border" />
                <span className="text-sm text-foreground/55">accuracy</span>
                <span className="h-4 w-px bg-border" />
                <span className="text-sm text-foreground/55">
                  {stats.correct} / {stats.correct + stats.wrong}
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto h-full max-h-[34rem] min-h-0 w-full">
            <div className="absolute -inset-2 -rotate-6 rounded-[26px] bg-card/40 ring-1 ring-border" />
            <div className="lift relative h-full overflow-hidden rounded-[26px] ring-1 ring-border">
              <img
                src={latest ? latest.photo : heroPortrait}
                alt={latest ? latest.name : "Portrait"}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
