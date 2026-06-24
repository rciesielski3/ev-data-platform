"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

const NavLinks = ({ links }: { links: NavLink[] }) => {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
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
