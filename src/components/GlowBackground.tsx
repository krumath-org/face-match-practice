export function GlowBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 size-[520px] rounded-full bg-accent/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-48 size-[560px] rounded-full bg-glow-blue/25 blur-[130px]" />
      <div className="absolute bottom-0 left-1/4 size-[420px] rounded-full bg-glow-periwinkle/25 blur-[120px]" />
    </div>
  );
}
