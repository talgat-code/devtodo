interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`surface-card border-dashed ${
        compact ? "p-5" : "p-8 sm:p-10"
      } text-center`}
    >
      <div className="animate-pop-in mx-auto mb-4">
        <div
          className={`mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-teal-100 font-semibold text-teal-600 transition-transform duration-300 hover:scale-110 ${
            compact ? "h-11 w-11 text-lg" : "h-14 w-14 text-2xl"
          }`}
        >
          +
        </div>
      </div>
      <h3 className={`text-slate-900 ${compact ? "text-lg" : "text-xl"}`}>{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <button className="primary-button mt-6" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
