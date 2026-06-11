"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* --------- bg glow --------- */}
        <div
          className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ backgroundColor: "var(--primary)", opacity: 0.07 }}
        />

        {/* --------- 404 display --------- */}
        <div className="relative select-none mb-6">
          <span
            className="font-bold leading-none tabular-nums"
            style={{
              fontSize: "clamp(7rem, 20vw, 12rem)",
              color: "var(--primary)",
              opacity: 0.12,
              letterSpacing: "-0.04em",
              display: "block",
            }}
          >
            404
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums leading-none"
            style={{
              fontSize: "clamp(7rem, 20vw, 12rem)",
              color: "var(--primary)",
              letterSpacing: "-0.04em",
              WebkitTextStroke: "2px var(--primary)",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </span>
        </div>

        {/* --------- message --------- */}
        <h1
          className="text-[22px] font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p
          className="mt-3 text-[14px] max-w-xs leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* --------- actions --------- */}
        <div className="mt-8 flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.back()}
            style={{ borderRadius: "10px" }}
          >
            <ArrowLeft size={15} />
            Go back
          </Button>
          <Button
            className="gap-2"
            onClick={() => router.push("/")}
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              borderRadius: "10px",
            }}
          >
            <Home size={15} />
            Home
          </Button>
        </div>
      </main>
    </div>
  );
}
