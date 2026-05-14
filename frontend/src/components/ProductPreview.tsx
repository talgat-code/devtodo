export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-teal-100/70 blur-3xl" />
      <div className="absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-amber-100/70 blur-3xl" />

      <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-white/90 p-4 shadow-[0_28px_90px_rgba(16,32,51,0.12)] backdrop-blur">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100/90 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-slate-500">
            Today
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[180px,minmax(0,1fr)]">
          <aside className="rounded-[28px] bg-slate-50/95 p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-teal-100" />
              <div>
                <div className="text-sm font-semibold text-slate-900">DevToDo</div>
                <div className="text-xs text-slate-400">Workspace</div>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                "Inbox",
                "Projects",
                "Upcoming",
                "Completed",
              ].map((item, index) => (
                <div
                  className={`rounded-2xl px-3 py-2.5 text-sm ${
                    index === 1
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-[28px] bg-slate-50/95 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Product roadmap
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  3 tasks for today
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                In progress
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-[24px] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-teal-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      Finalize onboarding copy
                    </div>
                    <div className="mt-1 text-xs leading-6 text-slate-400">
                      Clear messaging, calm tone, tidy structure
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] bg-white p-4 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Focus
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">02</div>
                  <div className="mt-1 text-xs text-slate-400">Priority tasks</div>
                </div>

                <div className="rounded-[24px] bg-slate-900 p-4 text-white shadow-sm">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-300">
                    Done
                  </div>
                  <div className="mt-2 text-2xl font-semibold">08</div>
                  <div className="mt-1 text-xs text-slate-300">Completed this week</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
