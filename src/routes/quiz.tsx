import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { GlowBackground } from "@/components/GlowBackground";
import { usePeople } from "@/hooks/use-people";
import { useTranslation } from "@/lib/i18n/context";
import { accuracy } from "@/lib/people-store";
import { buildQuestion, MIN_PEOPLE, type Question } from "@/lib/quiz";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Practice — KruFace" },
      { name: "description", content: "Match the face to the name, one question at a time." },
      { property: "og:title", content: "Practice — KruFace" },
      {
        property: "og:description",
        content: "Match the face to the name, one question at a time.",
      },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { people, stats, loaded, recordAnswer } = usePeople();
  const t = useTranslation();
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  const next = useCallback(
    (lastId?: string) => {
      setPicked(null);
      setQuestion(buildQuestion(people, lastId));
    },
    [people],
  );

  useEffect(() => {
    if (loaded && !question && people.length >= MIN_PEOPLE) {
      setQuestion(buildQuestion(people));
    }
  }, [loaded, question, people]);

  const pick = (id: string) => {
    if (picked || !question) return;
    setPicked(id);
    void recordAnswer(question.answer.id, id === question.answer.id);
    setRound((r) => r + 1);
  };

  const acc = accuracy(stats);

  if (loaded && people.length < MIN_PEOPLE) {
    const missing = MIN_PEOPLE - people.length;
    return (
      <Shell>
        <section className="fade-up glass grid min-h-0 flex-1 place-items-center gap-4 rounded-[28px] px-6 text-center ring-1 ring-border">
          <span className="text-sm text-foreground/55">
            {t(missing === 1 ? "quiz.needMore_one" : "quiz.needMore_other", { count: missing })}
          </span>
          <Link
            to="/people/add"
            className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40"
          >
            <Plus className="size-4" />
            {t("people.add")}
          </Link>
        </section>
      </Shell>
    );
  }

  if (!question) {
    return (
      <Shell>
        <div className="glass min-h-0 flex-1 rounded-[28px] ring-1 ring-border" />
      </Shell>
    );
  }

  const wasCorrect = picked === question.answer.id;

  return (
    <Shell>
      <section className="fade-up glass flex min-h-0 flex-1 flex-col rounded-[28px] p-5 ring-1 ring-border sm:p-6">
        <div className="mb-4 grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <Link
            to="/"
            aria-label={t("quiz.back")}
            className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground/70 ring-1 ring-border"
          >
            <ArrowLeft className="size-4" />
            {t("quiz.back")}
          </Link>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/45">
              {acc === null
                ? t("quiz.question", { number: round + 1 })
                : t("quiz.progress", { accuracy: acc, count: round })}
            </span>
            <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${acc ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {question.mode === "photo" ? (
          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-6">
            <div className="relative min-h-0">
              <div className="absolute -inset-2 rotate-3 rounded-[24px] bg-card/40 ring-1 ring-border" />
              <div className="relative h-full min-h-0 overflow-hidden rounded-[24px] ring-1 ring-border">
                <img
                  key={question.answer.id}
                  src={question.answer.photo}
                  alt={t("quiz.prompt")}
                  className="h-full w-full animate-fade-in object-cover"
                />
              </div>
            </div>

            <div className="grid min-h-0 grid-cols-2 gap-4 lg:grid-rows-2">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pick(option.id)}
                  className={`relative flex min-h-0 items-center rounded-[20px] p-5 text-left ring-1 ring-border transition-colors ${
                    picked
                      ? option.id === question.answer.id
                        ? "bg-accent/10 ring-2 ring-accent"
                        : option.id === picked
                          ? "bg-danger/10 ring-2 ring-danger/60"
                          : "bg-card/50"
                      : "lift bg-card/70"
                  }`}
                >
                  {picked && option.id === question.answer.id && (
                    <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Check className="size-3.5" />
                    </span>
                  )}
                  {picked && option.id === picked && option.id !== question.answer.id && (
                    <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-danger text-destructive-foreground">
                      <X className="size-3.5" />
                    </span>
                  )}
                  <p
                    className={`pr-8 text-2xl font-semibold tracking-tight ${
                      picked && option.id === picked && option.id !== question.answer.id
                        ? "line-through decoration-danger/50"
                        : ""
                    }`}
                  >
                    {option.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:gap-6">
            <p className="text-center text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {question.answer.name}
            </p>
            <div className="grid min-h-0 auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-4">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pick(option.id)}
                  className={`relative min-h-0 overflow-hidden rounded-[20px] ring-1 ring-border transition-colors ${
                    picked
                      ? option.id === question.answer.id
                        ? "ring-4 ring-accent"
                        : option.id === picked
                          ? "ring-4 ring-danger/60"
                          : "opacity-45"
                      : "lift"
                  }`}
                >
                  <img src={option.photo} alt="" className="h-full w-full object-cover" />
                  {picked && option.id === question.answer.id && (
                    <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Check className="size-4" />
                    </span>
                  )}
                  {picked && option.id === picked && option.id !== question.answer.id && (
                    <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-danger text-destructive-foreground">
                      <X className="size-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {picked && (
          <div className="mt-4 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl bg-card/60 px-5 py-3 ring-1 ring-border">
            <p className="min-w-0 text-sm text-foreground/70">
              {wasCorrect ? (
                <span className="font-semibold text-accent">{t("quiz.correct")}</span>
              ) : (
                t(question.mode === "photo" ? "quiz.wrongPickName" : "quiz.wrongPickPhoto", {
                  name: question.answer.name,
                })
              )}
            </p>
            <button
              type="button"
              onClick={() => next(question.answer.id)}
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("quiz.next")}
            </button>
          </div>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-mist text-ink">
      <GlowBackground />
      <AppHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pb-5 sm:px-6">
        {children}
      </main>
    </div>
  );
}
