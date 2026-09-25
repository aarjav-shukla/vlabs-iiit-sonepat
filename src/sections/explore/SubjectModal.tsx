"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Body } from "@/ui";

import { CircuitModel } from "./CircuitModel";
import { type ExploreSubject, type ExploreExperiment } from "./explore.data";

// ── Component ─────────────────────────────────────────────────────────────
type Props = {
  subject: ExploreSubject;
  onClose: () => void;
};

function NotchedPreviewBox({ children }: { children: React.ReactNode }) {
  // Polygon clip path matching Image 2 shallow notch shape:
  // Top horizontal to 94.5%, step down to 16%, shallow outward chamfer to 98.5% at y=32%,
  // vertical edge to 68%, shallow inward chamfer to 94.5% at y=84%, step down to bottom 99.25%.
  const polygonClip =
    "polygon(0.75% 0.75%, 94.5% 0.75%, 94.5% 16%, 98.5% 32%, 98.5% 68%, 94.5% 84%, 94.5% 99.25%, 0.75% 99.25%)";

  return (
    <div className="relative aspect-square w-full shrink-0">
      {/* 1. Neutral background surface fill clipped to exact polygon (no grey leak) */}
      <div
        className="absolute inset-0 bg-[var(--color-neutral)]"
        style={{ clipPath: polygonClip }}
      />

      {/* 2. 3D Model canvas inner content (z-10) clipped to symmetrical polygon */}
      <div
        className="relative z-10 w-full h-full overflow-hidden"
        style={{ clipPath: polygonClip }}
      >
        {children}
      </div>

      {/* 3. Symmetrical Border SVG overlay (z-20) layered OVER 3D canvas */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="0.75,0.75 94.5,0.75 94.5,16 98.5,32 98.5,68 94.5,84 94.5,99.25 0.75,99.25"
          fill="none"
          stroke="var(--color-black-40)"
          strokeWidth="1.75"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function SubjectModal({ subject, onClose }: Props) {
  // activeIndex starts as null so initial state displays Subject title with no description,
  // and 3D preview of the first experiment.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const router = useRouter();

  const activeExp: ExploreExperiment | null =
    activeIndex !== null ? subject.experiments[activeIndex] : null;

  // Circuit ID for 3D preview: selected experiment circuitId or first experiment circuitId
  const previewCircuitId =
    activeExp?.circuitId || subject.experiments[0]?.circuitId;

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleOpenLab() {
    if (activeExp?.labRoute) {
      router.push(activeExp.labRoute);
    }
  }

  const modal = (
    <div
      className={[
        "fixed inset-0 z-[300] flex items-center justify-center",
        "bg-[rgba(28,28,28,0.55)] backdrop-blur-[4px]",
        "p-[calc(var(--spacing-base)*4)]",
      ].join(" ")}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal
      aria-label={subject.title}
    >
      <div
        className={[
          "relative flex flex-col overflow-hidden bg-white rounded-[4px]",
          "max-h-[calc(100vh-calc(var(--spacing-base)*8))]",
          "max-w-[calc(100vw-calc(var(--spacing-base)*8))]",
          "w-[min(100%,1260px)]",
          "min-[921px]:flex-row min-[921px]:max-h-[660px] min-[921px]:min-h-[540px]",
        ].join(" ")}
      >
        {/* Close button */}
        <button
          className={[
            "absolute right-[calc(var(--spacing-base)*2)] top-[calc(var(--spacing-base)*2)]",
            "z-[1] cursor-pointer text-[length:20px] leading-none",
            "p-[calc(var(--spacing-base)*3)]",
            "text-[var(--ink-muted)]",
            "transition-colors duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            "hover:text-[var(--ink)]",
            "focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-blue)]",
            "focus-visible:outline-offset-2 focus-visible:rounded-[2px]",
            "motion-reduce:transition-none",
            "native-button-reset box-border",
          ].join(" ")}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* ── Left: preview of subject / selected experiment ── */}
        <div
          className={[
            "flex flex-col shrink-0 w-full overflow-y-auto",
            "p-[calc(var(--spacing-base)*6)]",
            "min-[921px]:w-[440px]",
          ].join(" ")}
        >
          {/* Notched 3D Model Box */}
          <NotchedPreviewBox>
            {previewCircuitId ? (
              <CircuitModel circuitId={previewCircuitId} />
            ) : null}
          </NotchedPreviewBox>

          <div className="flex flex-col gap-[calc(var(--spacing-base)*1.5)] mt-[calc(var(--spacing-base)*4)]">
            {activeIndex !== null && (
              <span className="text-[var(--ink-muted)] font-[family-name:var(--font-sans),sans-serif] text-[13px] font-normal">
                Experiment - {activeIndex + 1}
              </span>
            )}
            <h2 className="text-[var(--ink)] font-[family-name:var(--font-serif),serif] font-normal text-[1.625rem] leading-[1.25]">
              {activeIndex !== null ? activeExp?.title : subject.title}
            </h2>

            {(activeIndex !== null
              ? activeExp?.description
              : subject.description) && (
              <Body size="sm" muted className="text-[13px] leading-[1.5]">
                {activeIndex !== null
                  ? activeExp?.description
                  : subject.description}
              </Body>
            )}

            {activeIndex !== null &&
              (activeExp?.labRoute ? (
                <button
                  className={[
                    "native-button-reset box-border w-full text-center cursor-pointer",
                    "bg-[var(--ink)] text-white rounded-[4px]",
                    "font-[family-name:var(--font-sans),sans-serif] text-[13px] font-medium",
                    "mt-[calc(var(--spacing-base)*3)]",
                    "py-[calc(var(--spacing-base)*2.5)] px-[calc(var(--spacing-base)*5)]",
                    "transition-opacity duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "hover:opacity-[0.82]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-blue)] focus-visible:outline-offset-2",
                    "motion-reduce:transition-none",
                  ].join(" ")}
                  onClick={handleOpenLab}
                >
                  Open Lab →
                </button>
              ) : (
                <span
                  className={[
                    "inline-block mt-[calc(var(--spacing-base)*2)] text-center",
                    "border border-[var(--color-black-10)] rounded-[20px]",
                    "text-[var(--ink-muted)] font-[family-name:var(--font-sans),sans-serif] text-[11px]",
                    "py-[calc(var(--spacing-base)*1)] px-[calc(var(--spacing-base)*3)]",
                  ].join(" ")}
                >
                  Coming soon
                </span>
              ))}
          </div>
        </div>

        {/* ── Right: numbered list of all experiments ── */}
        <div
          className={[
            "flex flex-1 flex-col overflow-y-auto",
            "border-t border-[var(--color-black-10)]",
            "p-[calc(var(--spacing-base)*6)] min-[921px]:pl-[calc(var(--spacing-base)*8)]",
            "min-[921px]:border-l min-[921px]:border-[var(--color-black-10)] min-[921px]:border-t-0",
          ].join(" ")}
        >
          <h2 className="text-[var(--ink)] font-[family-name:var(--font-serif),serif] font-normal text-[2.25rem] leading-[1.2] mb-[calc(var(--spacing-base)*5)]">
            List of Experiments
          </h2>

          {subject.experiments.map((exp, i) => (
            <div key={exp.id}>
              <button
                className={[
                  "native-button-reset box-border w-full cursor-pointer rounded-[4px]",
                  "flex flex-col gap-[calc(var(--spacing-base)*1)]",
                  "p-[calc(var(--spacing-base)*3)] text-left",
                  "transition-[background] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  i === activeIndex
                    ? "bg-[var(--color-neutral)]"
                    : "bg-transparent",
                  "hover:bg-[var(--color-neutral)]",
                  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-blue)] focus-visible:outline-offset-2",
                  "motion-reduce:transition-none",
                ].join(" ")}
                onClick={() => setActiveIndex(i)}
              >
                <span className="text-[var(--ink-muted)] font-[family-name:var(--font-sans),sans-serif] text-[12px]">
                  Experiment - {i + 1}
                </span>
                <span className="text-[var(--ink)] font-[family-name:var(--font-serif),serif] font-normal text-[1.375rem] leading-[1.35]">
                  {exp.title}
                </span>
              </button>
              {i < subject.experiments.length - 1 && (
                <div className="border-t border-[var(--color-black-10)] mx-[calc(var(--spacing-base)*3)]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
