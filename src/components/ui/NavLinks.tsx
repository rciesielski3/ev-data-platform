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
            className={`rounded-full px-4 py-2 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
              link.accent
                ? "ml-1 bg-forest text-cream hover:bg-sun hover:text-forest"
                : isActive
                  ? "bg-forest/10 text-forest"
                  : "text-forest/80 hover:bg-forest/10 hover:text-forest"
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
