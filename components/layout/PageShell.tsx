import { Navbar } from "@/components/layout/Navbar";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function PageShell({ children, title, subtitle }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
