import { Star } from "lucide-react";

export const Testimonials = () => {
  const testimonials = [
    {
      quote:
        "metrIQ AI cut our instrumentation time by 80%. What used to take a week now takes a day.",
      name: "Sarah Chen",
      title: "Head of Product Analytics",
      company: "TechCorp",
      avatar: "SC",
    },
    {
      quote:
        "Finally, our engineering and product teams speak the same data language. No more confusion.",
      name: "Michael Torres",
      title: "VP of Engineering",
      company: "DataFlow",
      avatar: "MT",
    },
    {
      quote:
        "The AI agents are like having a dedicated data team that works 24/7. Game changer.",
      name: "Emily Rodriguez",
      title: "CEO",
      company: "StartupX",
      avatar: "ER",
    },
  ];

  return (
    <section className="py-24 px-6 bg-surface-dark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Loved by product teams
          </h2>
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-zinc-900/50 border border-white/10"
            >
              <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-zinc-500 text-sm">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
