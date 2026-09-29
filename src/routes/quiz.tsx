import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { GlowBackground } from "@/components/GlowBackground";
import { useItems } from "@/hooks/use-items";
import { useTranslation } from "@/lib/i18n/context";
import { accuracy } from "@/lib/items-store";
import { buildQuestion, MIN_ITEMS, type Question } from "@/lib/quiz";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Practice — KruMemory" },
      { name: "description", content: "Match the picture to the name, one question at a time." },
      { property: "og:title", content: "Practice — KruMemory" },
      {
        property: "og:description",
        content: "Match the picture to the name, one question at a time.",
      },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { visibleItems, stats, loaded, recordAnswer } = useItems();
  const t = useTranslation();
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  const next = useCallback(
    (lastId?: string) => {
      setPicked(null);
      setQuestion(buildQuestion(visibleItems, lastId));
    },
    [visibleItems],
  );

  useEffect(() => {
    if (loaded && !question && visibleItems.length >= MIN_ITEMS) {
      setQuestion(buildQuestion(visibleItems));
    }
  }, [loaded, question, visibleItems]);

  const pick = (id: string) => {
    if (picked || !question) return;
    setPicked(id);
    void recordAnswer(question.answer.id, id === question.answer.id);
    setRound((r) => r + 1);
  };

  const acc = accuracy(stats);

  if (loaded && visibleItems.length < MIN_ITEMS) {
    const missing = MIN_ITEMS - visibleItems.length;
    return (
      <Shell>
        <section className="fade-up glass grid min-h-0 flex-1 place-items-center gap-4 rounded-[28px] px-6 text-center ring-1 ring-border">
          <span className="text-sm text-foreground/55">
            {t(missing === 1 ? "quiz.needMore_one" : "quiz.needMore_other", { count: missing })}
          </span>
          <Link
            to="/items/add"
            className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40"
          >
            <Plus className="size-4" />
            {t("items.add")}
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
      <section className="fade-up glass flex min-h-0 flex-1 flex-col rounded-[28px] p-3 ring-1 ring-border lg:p-6">
        <div className="mb-3 grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 lg:mb-4 lg:gap-4">
          <Link
            to="/"
            aria-label={t("quiz.back")}
            className="inline-flex items-center gap-2 rounded-full bg-card/70 px-2.5 py-2 text-sm font-medium text-foreground/70 ring-1 ring-border lg:px-3.5"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">{t("quiz.back")}</span>
          </Link>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/45 lg:text-xs lg:tracking-[0.14em]">
              {acc === null
                ? t("quiz.question", { number: round + 1 })
                : t("quiz.progress", { accuracy: acc, count: round })}
            </span>
            <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-border lg:h-1.5 lg:w-24">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${acc ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {question.mode === "photo" ? (
          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-6">
            <div className="relative mx-auto w-full max-w-[min(100%,42dvh)] shrink-0 lg:mx-0 lg:h-full lg:max-w-none lg:min-h-0">
              <div className="absolute -inset-2 hidden rotate-3 rounded-[24px] bg-card/40 ring-1 ring-border lg:block" />
              <div className="relative aspect-square w-full overflow-hidden rounded-[20px] ring-1 ring-border lg:aspect-auto lg:h-full lg:min-h-0 lg:rounded-[24px]">
                <img
                  key={question.answer.id}
                  src={question.answer.photo}
                  alt={t("quiz.prompt")}
                  className="h-full w-full animate-fade-in object-cover"
                />
              </div>
            </div>

            <div className="grid min-h-0 grid-cols-2 gap-2 lg:grid-rows-2 lg:gap-4">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pick(option.id)}
                  className={`relative flex min-h-0 items-center rounded-[16px] p-3 text-left ring-1 ring-border transition-colors lg:rounded-[20px] lg:p-5 ${
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
                    <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-accent text-accent-foreground lg:right-4 lg:top-4 lg:size-6">
                      <Check className="size-3 lg:size-3.5" />
                    </span>
                  )}
                  {picked && option.id === picked && option.id !== question.answer.id && (
                    <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-danger text-destructive-foreground lg:right-4 lg:top-4 lg:size-6">
                      <X className="size-3 lg:size-3.5" />
                    </span>
                  )}
                  <p
                    className={`pr-6 text-lg font-semibold tracking-tight lg:pr-8 lg:text-2xl ${
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
          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:gap-6">
            <p className="text-center text-2xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {question.answer.name}
            </p>
            <div className="grid min-h-0 auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-4">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pick(option.id)}
                  className={`relative min-h-0 overflow-hidden rounded-[16px] ring-1 ring-border transition-colors lg:rounded-[20px] ${
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
                    <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-accent text-accent-foreground lg:right-3 lg:top-3 lg:size-7">
                      <Check className="size-3.5 lg:size-4" />
                    </span>
                  )}
                  {picked && option.id === picked && option.id !== question.answer.id && (
                    <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-danger text-destructive-foreground lg:right-3 lg:top-3 lg:size-7">
                      <X className="size-3.5 lg:size-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {picked && (
          <div className="mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl bg-card/60 px-3 py-2.5 ring-1 ring-border lg:mt-4 lg:gap-4 lg:px-5 lg:py-3">
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
      <main className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-3 pb-3 sm:px-6 lg:px-5 lg:pb-5">
        {children}
      </main>
    </div>
  );
}
