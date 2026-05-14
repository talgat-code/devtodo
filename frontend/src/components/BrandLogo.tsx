import placeholderLogo from "../assets/devtodo-logo.svg";

interface BrandLogoProps {
  imageSrc?: string;
  compact?: boolean;
  showTagline?: boolean;
}

export function BrandLogo({
  imageSrc = placeholderLogo,
  compact = false,
  showTagline = true,
}: BrandLogoProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
      <div
        className={`overflow-hidden rounded-[22px] border border-white/80 bg-white/90 shadow-[0_18px_38px_rgba(16,32,51,0.1)] ${
          compact ? "h-12 w-12 p-2" : "h-16 w-16 p-2.5"
        }`}
      >
        <img
          alt="DevToDo logo"
          className="h-full w-full rounded-[16px] object-cover"
          src={imageSrc}
        />
      </div>

      <div>
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
          DEVTODO
        </div>
        <div
          className={`font-display tracking-tight text-slate-900 ${
            compact ? "mt-0.5 text-xl" : "mt-1 text-[1.9rem]"
          }`}
        >
          DevToDo
        </div>
        {showTagline ? (
          <div className="mt-1 text-sm text-slate-500">
            A focused place for projects and tasks.
          </div>
        ) : null}
      </div>
    </div>
  );
}
