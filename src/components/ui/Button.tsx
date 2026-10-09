import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ember text-ink hover:bg-flame shadow-[0_10px_30px_rgba(255,77,26,0.35)]",
  secondary:
    "bg-cream text-ink hover:bg-gold",
  ghost:
    "border border-cream/20 text-cream hover:border-ember hover:text-ember",
};

type ButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold tracking-wide uppercase transition ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
