"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { useCloseOnScroll } from "@/components/ui/use-close-on-scroll";

type NavLink = {
  href: string;
  label: string;
};

const MobileNav = ({
  links,
  openLabel,
  closeLabel,
}: {
  links: NavLink[];
  openLabel: string;
  closeLabel: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setIsOpen(false), []);

  useCloseOnScroll(isOpen, close);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? closeLabel : openLabel}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-cream transition-colors hover:bg-sun hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isOpen && (
        <div className="absolute inset-x-3 top-[4.5rem] z-30 max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain rounded-3xl border border-forest/10 bg-paper p-3 shadow-2xl shadow-forest/20">
          <nav className="flex flex-col gap-1 text-base font-medium">
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-2xl px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-forest text-cream"
                      : "text-forest/85 hover:bg-forest/10 hover:text-forest"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
