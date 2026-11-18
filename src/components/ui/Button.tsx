import type { ComponentPropsWithoutRef, ElementType } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "warning"
  | "cta"
  | "inverse";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-forest text-cream shadow-lg shadow-forest/20 hover:-translate-y-0.5 hover:bg-sun hover:text-forest focus-visible:outline-forest font-semibold",
  secondary:
    "border border-forest/25 bg-transparent text-forest hover:border-forest hover:bg-forest hover:text-cream focus-visible:outline-forest",
  ghost:
    "bg-forest/5 text-forest hover:bg-forest/10 focus-visible:outline-forest",
  warning:
    "bg-amber-700 text-white hover:bg-amber-800 focus-visible:outline-amber-700",
  inverse:
    "border border-cream/30 text-cream hover:border-cream hover:bg-cream hover:text-forest focus-visible:outline-cream",
  cta: "bg-sun text-forest font-semibold shadow-lg shadow-sun/30 hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-sun",
};

const SIZE_CLASSES = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

type ButtonOwnProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
};

type ButtonProps<T extends ElementType> = ButtonOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps<T>>;

const Button = <T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps<T>) => {
  const Component = (as ?? "button") as ElementType;
  const classNameValue = (className ?? "") as string;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <Component
      className={`${base} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${classNameValue}`.trim()}
      {...rest}
    />
  );
};

export default Button;
