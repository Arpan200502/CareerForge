"use client";
import { Sparkles } from "lucide-react";

const footerLinks = {
  Platform: ["Features", "Pricing", "About", "FAQ"],
  Resources: ["Blog", "Documentation", "Help Center", "Community"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-5 text-white" />
              <span className="font-bold text-white tracking-tight">CareerForge</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs">
              AI-powered career development ecosystem. Build, analyze, and optimize your career journey.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} CareerForge. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Built for the next generation of careers.
          </p>
        </div>
      </div>
    </footer>
  );
}
