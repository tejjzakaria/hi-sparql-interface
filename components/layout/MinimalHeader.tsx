import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function MinimalHeader() {
  return (
    <header className="flex h-14 items-center justify-between px-6">
      <Link
        href="/"
        className="text-sm font-semibold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        HI Query
      </Link>
      <ThemeToggle />
    </header>
  );
}
