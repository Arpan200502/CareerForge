# CareerForge Theme Reference

> Use this document to replicate the CareerForge landing page visual style on sub-pages and feature pages.

---

## 1. Color Palette (HSL)

All colors are defined as CSS custom properties in `app/globals.css`. **Dark mode is the default** — there is no light mode toggle.

### :root (Dark Mode Default)

| Token                      | Light Mode              | Dark Mode (:root) |
| -------------------------- | ----------------------- | ----------------- |
| `--background`             | `0 0% 100%`            | `0 0% 0%`         |
| `--foreground`             | `0 0% 3.9%`            | `0 0% 98%`        |
| `--card`                   | `0 0% 100%`            | `0 0% 3%`         |
| `--card-foreground`        | `0 0% 3.9%`            | `0 0% 98%`        |
| `--popover`                | `0 0% 100%`            | `0 0% 3%`         |
| `--popover-foreground`     | `0 0% 3.9%`            | `0 0% 98%`        |
| `--primary`                | `0 0% 9%`              | `0 0% 98%`        |
| `--primary-foreground`     | `0 0% 98%`             | `0 0% 9%`         |
| `--secondary`              | `0 0% 96.1%`           | `0 0% 14.9%`      |
| `--secondary-foreground`   | `0 0% 9%`              | `0 0% 98%`        |
| `--muted`                  | `0 0% 96.1%`           | `0 0% 14.9%`      |
| `--muted-foreground`       | `0 0% 45.1%`           | `0 0% 63.9%`      |
| `--accent`                 | `0 0% 96.1%`           | `0 0% 14.9%`      |
| `--accent-foreground`      | `0 0% 9%`              | `0 0% 98%`        |
| `--destructive`            | `0 84.2% 60.2%`        | `0 62.8% 30.6%`   |
| `--destructive-foreground` | `0 0% 98%`             | `0 0% 98%`        |
| `--border`                 | `0 0% 89.8%`           | `0 0% 14.9%`      |
| `--input`                  | `0 0% 89.8%`           | `0 0% 14.9%`      |
| `--ring`                   | `0 0% 3.9%`            | `0 0% 83.1%`      |
| `--radius`                 | `0.5rem`               | `0.5rem`          |

### Usage in Tailwind

```ts
// tailwind.config.ts
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
  secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
  destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
  muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
  accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
  popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
  card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
}
```

---

## 2. Typography

| Property          | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| Font family       | `Inter` (loaded via `next/font/google`)                               |
| Weights loaded    | `400`, `500`, `600`, `700`, `800`, `900`                              |
| Applied via       | `fontInter.className` on `<body>` in `layout.tsx`                     |
| Fallback          | System sans-serif (`font-sans` in Tailwind)                           |
| Monospace         | `font-mono` for labels, badges, and the "AI-Powered" badge            |
| Body text         | `text-sm md:text-base` → `text-neutral-300` or `text-white/50` / `text-neutral-400` |
| Muted text        | `text-white/40`, `text-white/50`, `text-white/60`, `text-neutral-400` |
| Bright text       | `text-white`                                                          |
| Hero heading      | `text-4xl md:text-6xl font-bold` + `bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400` |

### Common Text Patterns

| Use Case                              | Classes                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Section heading                       | `text-3xl md:text-4xl font-bold text-white mt-4`                        |
| Section subheading                    | `text-white/50 text-sm mt-2 max-w-xl mx-auto`                           |
| Section description                   | `text-neutral-400 max-w-2xl mx-auto text-sm md:text-base`               |
| CTA heading                           | `text-3xl md:text-5xl font-bold text-white`                             |
| CTA description                       | `text-white/60 max-w-xl mx-auto text-sm md:text-base`                   |
| Inline badge                          | `rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm px-4 py-1 font-mono text-sm text-white/80` |
| Small label with icon                 | `text-sm font-mono text-white/60`                                       |
| Footer copyright                      | `text-xs text-white/40`                                                  |
| Footer link                           | `text-sm text-white/50 hover:text-white transition-colors`               |

---

## 3. Animations

### CSS Keyframes (in `globals.css`)

```css
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}

@keyframes slideDown {
  from { height: 0; opacity: 0; }
  to { height: var(--slide-height); opacity: 1; }
}

@keyframes preloader-wave {
  0%, 100% { transform: scaleY(1); background: rgba(255,255,255,0.6); }
  50% { transform: scaleY(1.8); background: rgba(255,255,255,1); }
}

@keyframes preloader-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}
```

### Tailwind Animation Config

```ts
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "spotlight": "spotlight 2s ease 1s forwards",
  ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
  "slide-down": "slideDown 0.3s ease-out",
  "preloader-wave": "preloader-wave 1s ease-in-out infinite",
  "preloader-dot": "preloader-dot 1.4s ease-in-out infinite",
}
```

### Framer Motion (used in components)

| Component                     | Motion pattern                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Page content mount            | `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: "easeInOut" }}` |
| Section reveal (scroll)       | `initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}` |
| CTA section reveal            | `transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}` (custom cubic bezier) |
| Shader section overlay        | Same as section reveal above                                                   |
| BorderTrail                   | `animate={{ offsetDistance: ["0%", "100%"] }} transition={{ repeat: Infinity, duration: 5, ease: "linear" }}` |
| ButtonColorful spotlight      | Mouse-position-tracked `div` with `radial-gradient` via inline `style`          |

### AnimatePresence

Used for the preloader → main content transition with `mode="wait"`.

---

## 4. Gradients & Effects

| Effect                   | Implementation                                                                 |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Hero heading**         | `bg-gradient-to-b from-neutral-50 to-neutral-400` + `bg-clip-text text-transparent` |
| **ButtonColorful bg**    | `bg-gradient-to-r from-neutral-900 to-neutral-950`                             |
| **ButtonColorful spotlight** | Absolutely positioned `div` with `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.12), transparent 40%)` |
| **Spotlight SVG**        | Large blurred ellipse (`feGaussianBlur stdDeviation="151"`) with `fillOpacity="0.21"`, positioned absolutely, animated via `animate-spotlight` |
| **Card background**      | `bg-black/[0.96]` with `border-white/10`                                      |
| **Feature badge**        | `bg-black/60 backdrop-blur-sm border border-white/10`                          |
| **Shader section**       | `ShaderAnimation` component (canvas-based shader effect)                        |
| **Pricing cards**        | `single-pricing-card-1` — gradient borders with `BorderTrail`                   |
| **Footer top border**    | `border-t border-white/10`                                                     |
| **Preloader bar**        | `bg-gradient-to-r from-white/60 via-white to-white/60` with `preloader-bar-glow` filter |

---

## 5. Border Radius

| Token         | Value          |
| ------------- | -------------- |
| `--radius`    | `0.5rem`       |
| card          | `rounded-xl`   |
| button        | `rounded-xl`   |
| badge         | `rounded-full` |
| feature badge | `rounded-lg`   |
| input         | `rounded-md`   |

Tailwind config:
```ts
borderRadius: {
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
}
```

---

## 6. Spacing & Layout

- **Site background**: `bg-black`
- **Main container**: `mx-auto w-full max-w-6xl px-4`
- **Section padding**: `py-24` (CTA section)
- **Card header**: `p-8 md:p-12`
- **Footer**: `px-4 py-12`
- **Feature grid**: `grid grid-cols-2 md:grid-cols-4 gap-8` (footer)
- **Component gap**: `gap-3`, `gap-4`, `gap-6`, `gap-8`, `space-y-2`, `space-y-6`
- **Hero section**: `relative min-h-screen flex items-center justify-center`
- **Card height**: `h-[600px]`
- **Shader section height**: `h-[500px]`

---

## 7. Button Component Code

### `components/ui/button.tsx` — Base shadcn Button

```tsx
"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

**Variants summary:**

| Variant      | Classes                                                   |
| ------------ | --------------------------------------------------------- |
| `default`    | `bg-primary text-primary-foreground hover:bg-primary/90`  |
| `secondary`  | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `destructive`| `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| `outline`    | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| `ghost`      | `hover:bg-accent hover:text-accent-foreground`            |
| `link`       | `text-primary underline-offset-4 hover:underline`         |

### `components/ui/button-colorful.tsx` — Gradient Border Button with Spotlight

```tsx
"use client";
import { type ButtonHTMLAttributes, useRef, type ReactNode } from "react";
import { cn } from "@/app/lib/utils";

type ButtonColorfulProps = {
  label?: string;
  children?: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function ButtonColorful({ label, children, className, ...props }: ButtonColorfulProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    buttonRef.current.style.setProperty("--mouse-x", `${x}px`);
    buttonRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative isolate overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-neutral-900 to-neutral-950 px-6 py-3 text-white transition-all duration-300",
        "hover:border-white/20",
        className,
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2 text-sm font-medium">
        {children || label}
      </span>
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.12), transparent 40%)",
        }}
      />
    </button>
  );
}
```

**Usage pattern on landing page:**

```tsx
<ButtonColorful label="Start Building Your Career" />
<ButtonColorful label="Get Started Free →" className="h-12 px-8 text-base" />
```

---

## 8. Badge Component (`components/ui/badge.tsx`)

```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
```

---

## 9. Border Trail (Used on Pricing Cards)

```tsx
<BorderTrail size={60} />
```

- Absolutely positioned animated div that travels along the border via `offset-path`
- Uses `motion.div` with `offsetDistance: ["0%", "100%"]`
- Default size: 60, default transition: `{ repeat: Infinity, duration: 5, ease: "linear" }`
- Styled as `aspect-square bg-zinc-500`

---

## 10. Card Component (`components/ui/card.tsx`)

```tsx
<div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} />
```

On the landing page, the hero card uses overrides:
```tsx
<Card className="w-full max-w-6xl mx-4 h-[600px] bg-black/[0.96] relative overflow-hidden border-white/10">
```

---

## 11. cn() Utility (`app/lib/utils.ts`)

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 12. Icons

- Package: `lucide-react`
- Used on landing page: `FileText`, `User`, `Award`, `Briefcase`, `Sparkles`
- Size pattern: `size-5` (inline with text), `size-8`, `size-12`, `size-16` (larger contexts)
- Color: `text-white` unless muted (`text-white/50`, `text-white/60`)

---

## 13. Key Dependencies (from `package.json`)

| Package                        | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `next`                         | Framework                                |
| `react` / `react-dom`          | UI library                               |
| `framer-motion`                | Animations                               |
| `lucide-react`                 | Icons                                    |
| `class-variance-authority`     | Component variant logic (`cva`)          |
| `clsx` + `tailwind-merge`      | Class merging (`cn()`)                   |
| `tailwindcss-animate`          | Tailwind animation utilities             |
| `three` / `@splinetool/react-spline` | 3D Spline scene in hero            |
| `@radix-ui/react-slot`         | Polymorphic `Slot` component             |

---

## 14. Reusable Section Template

```tsx
<section className="relative overflow-hidden py-24 bg-black">
  <div className="mx-auto w-full max-w-4xl px-4 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="space-y-6"
    >
      <h2 className="text-3xl md:text-5xl font-bold text-white">
        {/* Heading */}
      </h2>
      <p className="text-white/60 max-w-xl mx-auto text-sm md:text-base">
        {/* Description */}
      </p>
      <div className="flex justify-center">
        <ButtonColorful label="CTA Button" className="h-12 px-8 text-base" />
      </div>
    </motion.div>
  </div>
</section>
```
