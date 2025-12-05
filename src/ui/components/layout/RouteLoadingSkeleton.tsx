type RouteLoadingSkeletonProps = {
  title: string;
  description?: string;
};

export function RouteLoadingSkeleton({ title, description }: RouteLoadingSkeletonProps) {
  return (
    <section
      className="space-y-6 rounded-3xl border border-white/5 bg-card/50 p-6 shadow-inner"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-16 w-full animate-pulse rounded-2xl border border-white/5 bg-white/5"
          />
        ))}
      </div>
    </section>
  );
}
