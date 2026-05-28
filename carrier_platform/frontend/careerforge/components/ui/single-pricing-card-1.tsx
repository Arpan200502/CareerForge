"use client";
import React from "react";
import { PlusIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";
import { BorderTrail } from "@/components/ui/border-trail";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "5 Resume Analyses per 15 Days",
      "5 Job Fit Resume Generations per 15 Days",
      "1 Interview Preparation Session per 15 Days",
      "3 Cover Letter Generations per 15 Days",
      "Access to 10 Job Listings at a Time",
    ],
    highlighted: false,
    badge: null,
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "99",
    period: "/month",
    description: "Best value for active job seekers",
    features: [
      "50 Resume Analyses per Month",
      "30 Job Fit Resume Generations",
      "20 Interview Preparations",
      "30 Cover Letter Generations",
      "Access to 100 Job Listings",
    ],
    highlighted: true,
    badge: "11% off",
    badgeVariant: "secondary" as const,
    originalPrice: "₹149",
    buttonText: "Start Your Journey",
    buttonVariant: "outline" as const,
  },
  {
    name: "Max",
    price: "299",
    period: "/month",
    description: "Unlock everything with Max plan",
    features: [
      "100 Resume Analyses",
      "100 Job Fit Resume Generations",
      "35 Interview Preparations",
      "60 Cover Letter Generations",
      "Unlimited Job Listing Access",
    ],
    highlighted: false,
    badge: "22% off",
    badgeVariant: "default" as const,
    originalPrice: "₹399",
    buttonText: "Get Started Now",
    buttonVariant: "default" as const,
  },
];

export function Pricing() {
  return (
    <section className="relative overflow-hidden py-24 bg-black">
      <div id="pricing" className="mx-auto w-full max-w-6xl space-y-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl space-y-5"
        >
          <div className="flex justify-center">
            <div className="rounded-lg border px-4 py-1 font-mono text-sm text-white border-white/20">
              Pricing
            </div>
          </div>
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tighter text-white md:text-3xl lg:text-4xl">
            Pricing Based on Your Success
          </h2>
          <p className="text-white/60 mt-5 text-center text-sm md:text-base">
            Choose the plan that fits your career goals. All plans include AI-powered tools to accelerate your job search.
          </p>
        </motion.div>

        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute inset-0 size-full",
              "bg-[linear-gradient(to_right,hsl(240_5%_64.9%/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(240_5%_64.9%/0.2)_1px,transparent_1px)]",
              "bg-[size:32px_32px]",
              "[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent)]",
            )}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mx-auto w-full max-w-5xl"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, idx) => (
                <div key={idx} className="relative">
                  {plan.highlighted ? (
                    <div className="relative rounded-lg border border-white/30 bg-zinc-900/80 p-6 h-full">
                      <BorderTrail
                        style={{
                          boxShadow: "0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%)",
                        }}
                        size={100}
                      />
                      <PlanContent plan={plan} idx={idx} />
                    </div>
                  ) : (
                    <div className="relative rounded-lg border border-white/10 bg-zinc-900/50 p-6 h-full">
                      <PlanContent plan={plan} idx={idx} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-white/60 flex items-center justify-center gap-x-2 text-sm mt-10">
              <ShieldCheckIcon className="size-4" />
              <span>Access to all features with no hidden fees. Upgrade or cancel anytime.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PlanContent({ plan, idx }: { plan: typeof plans[0]; idx: number }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
          {plan.badge && (
            <Badge variant={plan.badgeVariant as "default" | "secondary"}>
              {plan.badge}
            </Badge>
          )}
        </div>
        <p className="text-white/60 text-sm">{plan.description}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-end gap-0.5 text-white/60">
          <span className="text-sm">₹</span>
          <span className="text-white text-4xl font-extrabold tracking-tighter md:text-5xl">
            {plan.price}
          </span>
          <span className="text-sm mb-1">{plan.period}</span>
          {plan.originalPrice && (
            <span className="text-white/40 text-sm line-through ml-2 mb-1">{plan.originalPrice}</span>
          )}
        </div>
      </div>

      <Button className="w-full" variant={plan.buttonVariant}>
        {plan.buttonText}
      </Button>

      <ul className="space-y-3 pt-2">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-white/70">
            <PlusIcon className="size-4 mt-0.5 shrink-0 text-white/40" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
