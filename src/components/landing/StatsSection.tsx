export const StatsSection = () => {
  const stats = [
    {
      value: "10x",
      label: "faster",
      description: "metric definition vs. manual process",
    },
    {
      value: "95%",
      label: "reduction",
      description: "in tracking errors",
    },
    {
      value: "50+",
      label: "hours saved",
      description: "per month per team",
    },
    {
      value: "100%",
      label: "consistency",
      description: "across all instrumentation",
    },
  ];

  return (
    <section className="py-24 px-6 bg-surface-dark border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Real results from real teams
          </h2>
          <p className="text-zinc-400 text-lg">
            Based on data from companies using metrIQ AI
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-primary font-semibold text-lg mb-1">
                {stat.label}
              </div>
              <div className="text-zinc-500 text-sm">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
