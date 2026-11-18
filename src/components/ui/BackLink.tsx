import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const variants = {
  emerald: "border-forest/20 text-forest hover:border-forest hover:bg-sun",
  amber:
    "border-amber-700/30 text-amber-900 hover:border-amber-700 hover:bg-amber-50",
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
  return (
    <div className={`mb-8 ${className}`}>
      <Link
        href={href}
        className={`group inline-flex min-h-10 items-center rounded-full border bg-paper px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun ${variants[variant]}`}
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 motion-safe:group-hover:-translate-x-1" />
        {label}
      </Link>
    </div>
  );
}
