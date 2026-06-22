import type { ComponentPropsWithoutRef, ElementType } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "warning";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-emerald-600",
  ghost:
    "text-emerald-700 hover:text-emerald-900 focus-visible:outline-emerald-600",
  warning:
    "bg-amber-900 text-white hover:bg-amber-800 focus-visible:outline-amber-900",
};

type ButtonOwnProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
};

type ButtonProps<T extends ElementType> = ButtonOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps<T>>;

const Button = <T extends ElementType = "button">({
  as,
  variant = "primary",
  className,
  ...rest
}: ButtonProps<T>) => {
  const Component = (as ?? "button") as ElementType;
  const classNameValue = (className ?? "") as string;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <Component
      className={`${base} ${VARIANT_CLASSES[variant]} ${classNameValue}`.trim()}
      {...rest}
    />
  );
};

export default Button;
