"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import NavDropdown from "@/components/ui/NavDropdown";

type NavLinkItem = {
  href: string;
  label: string;
  accent?: boolean;
};

type NavDropdownGroup = {
  label: string;
  dropdown: true;
  items: { href: string; label: string }[];
};

export type NavLink = NavLinkItem | NavDropdownGroup;

const NavLinks = ({ links }: { links: NavLink[] }) => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <>
      {links.map((link) => {
        if ("dropdown" in link) {
          return (
            <NavDropdown
              key={link.label}
              label={link.label}
              items={link.items}
              isOpen={openDropdown === link.label}
              onToggle={() =>
                setOpenDropdown((current) =>
                  current === link.label ? null : link.label,
                )
              }
            />
          );
        }

        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3 py-1 transition-colors ${
              isActive
                ? "bg-emerald-600 text-white"
                : link.accent
                  ? "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  : "text-slate-600 hover:text-emerald-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
};

export default NavLinks;
