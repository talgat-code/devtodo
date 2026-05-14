import { BrandLogo } from "./BrandLogo";
import { ProductPreview } from "./ProductPreview";

const highlights = [
  "Organize with clarity",
  "Track without clutter",
  "Stay on what matters",
];

export function HeroSection() {
  return (
    <section className="relative order-2 animate-float-in lg:order-1">
      <div className="mx-auto max-w-[36rem] lg:mx-0 lg:max-w-[42rem]">
        <BrandLogo showTagline={false} />

        <div className="mt-10">
          <h1 className="max-w-3xl text-4xl leading-[1.02] text-slate-900 sm:text-5xl xl:text-[4.25rem]">
            Plan clearly. Work calmly.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            A focused place for projects and tasks.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-3">
          {highlights.map((item) => (
            <div className="flex items-center gap-2.5 text-sm text-slate-500" key={item}>
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <ProductPreview />
        </div>

        <p className="mt-6 max-w-lg text-sm leading-7 text-slate-400">
          Built for steady progress, gentle structure, and a clearer daily rhythm.
        </p>
      </div>
    </section>
  );
}
