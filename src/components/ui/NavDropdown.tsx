"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

import { useCloseOnScroll } from "@/components/ui/use-close-on-scroll";

type NavDropdownItem = {
  href: string;
  label: string;
};

type NavDropdownProps = {
  label: string;
  items: NavDropdownItem[];
  isOpen: boolean;
  onToggle: () => void;
};

const NavDropdown = ({ label, items, isOpen, onToggle }: NavDropdownProps) => {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isGroupActive = items.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useCloseOnScroll(isOpen, onToggle);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onToggle();
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div
      className="relative"
      ref={containerRef}
      onBlur={(event) => {
        if (isOpen && !event.currentTarget.contains(event.relatedTarget)) onToggle();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex items-center gap-1 rounded-full px-4 py-2 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
          isGroupActive || isOpen
            ? "bg-forest/10 text-forest"
            : "text-forest/80 hover:bg-forest/10 hover:text-forest"
        }`}
      >
        {label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-3 min-w-52 rounded-2xl border border-forest/10 bg-paper p-1.5 shadow-xl shadow-forest/15">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={onToggle}
                className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-forest/10 font-medium text-forest"
                    : "text-forest/80 hover:bg-forest/10 hover:text-forest"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
