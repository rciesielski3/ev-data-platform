import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const variants = {
  emerald: {
    border: "border-emerald-700",
    text: "text-emerald-700",
    hoverText: "hover:text-emerald-900",
    hoverBg: "hover:bg-emerald-50",
  },
  amber: {
    border: "border-amber-700",
    text: "text-amber-700",
    hoverText: "hover:text-amber-900",
    hoverBg: "hover:bg-amber-50",
  },
} as const;

type BackLinkProps = {
  href: string;
  label: string;
  variant?: keyof typeof variants;
  className?: string;
};

export default function BackLink({
  href,
  label,
  variant = "emerald",
  className = "",
}: BackLinkProps) {
  const colors = variants[variant];

  return (
    <div className={`mb-8 ${className}`}>
      <Link
        href={href}
        className={`
          inline-flex items-center rounded-md border bg-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-x-1
          ${colors.border}
          ${colors.text}
          ${colors.hoverText}
          ${colors.hoverBg}
        `}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </div>
  );
}
