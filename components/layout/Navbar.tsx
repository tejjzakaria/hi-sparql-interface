"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/query", label: "Query" },
  { href: "/history", label: "History" },
  { href: "/submit", label: "Submit" },
  { href: "/help", label: "Help" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // --------- close on navigate ---------
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // --------- lock scroll ---------
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* --------- top bar --------- */}
      <header
        className="sticky top-0 z-50 w-full border-b border-border"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* --------- brand --------- */}
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            HI Query
          </Link>

          {/* --------- controls --------- */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {/* --------- icon crossfade --------- */}
              <span className="relative flex h-[18px] w-[18px] items-center justify-center">
                <Menu
                  size={18}
                  style={{
                    position: "absolute",
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                    opacity: isOpen ? 0 : 1,
                    transform: isOpen
                      ? "rotate(45deg) scale(0.4)"
                      : "rotate(0deg) scale(1)",
                  }}
                />
                <X
                  size={18}
                  style={{
                    position: "absolute",
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen
                      ? "rotate(0deg) scale(1)"
                      : "rotate(-45deg) scale(0.4)",
                  }}
                />
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* --------- full page overlay --------- */}
      <div
        aria-hidden={!isOpen}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          backgroundColor: "var(--background)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* --------- nav items --------- */}
        <nav className="flex flex-col items-center gap-0">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <div
                key={link.href}
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? "translateY(0px)" : "translateY(22px)",
                  transition: `opacity 0.4s ease ${isOpen ? i * 65 + 80 : 0}ms, transform 0.45s cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? i * 65 + 80 : 0}ms`,
                }}
              >
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-baseline gap-4 py-2.5 select-none"
                >
                  {/* --------- index number --------- */}
                  <span
                    className="font-mono text-[11px] tabular-nums"
                    style={{
                      color: "var(--text-muted)",
                      minWidth: "1.5rem",
                      textAlign: "right",
                      paddingBottom: "0.15em",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* --------- link label --------- */}
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      fontSize: "clamp(2rem, 5vw, 2.75rem)",
                      color: isActive ? "var(--primary)" : "var(--text-primary)",
                      transition: "color 0.15s ease",
                      lineHeight: 1.15,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--text-primary)";
                    }}
                  >
                    {link.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* --------- bottom label --------- */}
        <p
          className="absolute bottom-8 text-[12px] tracking-widest uppercase font-medium"
          style={{
            color: "var(--text-muted)",
            opacity: isOpen ? 1 : 0,
            transition: `opacity 0.4s ease ${isOpen ? 520 : 0}ms`,
          }}
        >
          Hybrid Intelligence Knowledge Graph
        </p>
      </div>
    </>
  );
}
