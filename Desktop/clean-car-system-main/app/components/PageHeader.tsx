export default function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden mb-8">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 pointer-events-none"
        style={{
          width: 420,
          height: 220,
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-accent) 14%, transparent) 0%, transparent 70%)",
          filter: "blur(16px)",
        }}
      />
      <div className="flex items-center gap-3">
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: "var(--color-accent-soft)" }}
        >
          {icon}
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
