"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const exampleBadges = [
  "Human-AI trust",
  "Delegation",
  "Explainability",
  "Collaborative decision making",
  "Reliance",
];

export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function navigate() {
    router.push("/query");
  }

  return (
    <>
      {/* --------- search row --------- */}
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2 w-full max-w-xl">
          <Input
            placeholder="e.g. human-AI trust, delegation, explainability..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate()}
            className="flex-1"
            style={{ borderRadius: "8px" }}
          />
          <Button
            onClick={navigate}
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              borderRadius: "8px",
            }}
          >
            <Search size={16} />
            Search
          </Button>
        </div>
      </div>

      {/* --------- example badges --------- */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {exampleBadges.map((label) => (
          <Badge
            key={label}
            variant="outline"
            className="cursor-pointer hover:bg-primary-soft hover:text-primary transition-colors"
            style={{ borderRadius: "6px" }}
            onClick={navigate}
          >
            {label}
          </Badge>
        ))}
      </div>
    </>
  );
}
