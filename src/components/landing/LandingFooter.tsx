import { Twitter, Github, Linkedin } from "lucide-react";

export const LandingFooter = () => {
  const footerLinks = {
    Product: ["Features", "Integrations", "Pricing", "Changelog"],
    Resources: ["Documentation", "API Reference", "Community"],
    Company: ["About", "Blog", "Careers"],
  };

  return (
    <footer className="border-t border-white/5 bg-zinc-950 pt-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
        {/* Brand */}
        <div className="col-span-2 space-y-6">
          <a
            href="#"
            className="text-white font-bold tracking-tighter text-2xl flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary" />
            metrIQ AI
          </a>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
            The AI-powered platform for metrics, taxonomy, and instrumentation
            planning.
          </p>
          <div className="flex gap-5 text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Links */}
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category} className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-white">{category}</h4>
            {links.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-sm text-zinc-600 font-medium">
          &copy; {new Date().getFullYear()} metrIQ AI. All rights reserved.
        </div>
        <div className="flex gap-8">
          <a
            href="#"
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};
