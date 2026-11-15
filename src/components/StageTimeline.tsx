"use client";

import { PIPELINE_STAGES, STAGE_METADATA } from "@/lib/config";
import { JobApplication, PipelineStage } from "@/lib/types";
import { Check, Clock, Sparkles, XCircle } from "lucide-react";

interface StageTimelineProps {
  application: JobApplication;
}

function formatShortDate(iso?: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export default function StageTimeline({ application }: StageTimelineProps) {
  const isRejected = application.currentStage === "Rejected";
  const isHired = application.currentStage === "Hired";

  const activeStageForIndex: PipelineStage = isRejected
    ? application.lastActivePipelineStage || "Applied"
    : (application.currentStage as PipelineStage);

  const activeIndex = Math.max(
    0,
    PIPELINE_STAGES.indexOf(activeStageForIndex)
  );

  // Map latest date each stage appeared in history
  const stageDates: Partial<Record<string, string>> = {};
  for (const item of application.history || []) {
    stageDates[item.stage] = item.updatedAt;
  }
  if (!stageDates["Applied"]) {
    stageDates["Applied"] = application.appliedAt;
  }

  return (
    <div className="w-full">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background Connector Track */}
          <div
            className="absolute left-[10%] right-[10%] top-5 h-1 rounded-full bg-slate-200"
            aria-hidden="true"
          />

          {/* Filled Progress Connector */}
          <div
            className={`absolute left-[10%] top-5 h-1 rounded-full transition-all duration-500 ${
              isRejected
                ? "bg-slate-400"
                : isHired
                ? "bg-emerald-500"
                : "bg-indigo-600"
            }`}
            style={{
              width: `${(activeIndex / (PIPELINE_STAGES.length - 1)) * 80}%`,
            }}
            aria-hidden="true"
          />

          <ol className="relative z-10 grid grid-cols-5 gap-3">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCompleted =
                idx < activeIndex || (isHired && idx === activeIndex);
              const isCurrent = idx === activeIndex && !isHired && !isRejected;
              const isClosedPoint = idx === activeIndex && isRejected;
              const dateStr = formatShortDate(
                isClosedPoint
                  ? stageDates["Rejected"] || application.updatedAt
                  : stageDates[stage]
              );

              return (
                <li
                  key={stage}
                  className="flex flex-col items-center text-center"
                >
                  {/* Step Circle */}
                  <div className="relative flex items-center justify-center">
                    {isCurrent && (
                      <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-indigo-400 opacity-25" />
                    )}
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                        isCompleted
                          ? isHired
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/25"
                            : "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                          : isCurrent
                          ? "border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-50"
                          : isClosedPoint
                          ? "border-rose-400 bg-rose-50 text-rose-600 ring-4 ring-rose-50"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        stage === "Hired" ? (
                          <Sparkles className="h-4 w-4" />
                        ) : (
                          <Check className="h-5 w-5 stroke-[2.5]" />
                        )
                      ) : isClosedPoint ? (
                        <XCircle className="h-5 w-5" />
                      ) : isCurrent ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                  </div>

                  {/* Label & Status */}
                  <div className="mt-3 px-1">
                    <p
                      className={`text-sm font-semibold ${
                        isCompleted || isCurrent
                          ? "text-slate-900"
                          : isClosedPoint
                          ? "text-rose-700"
                          : "text-slate-400"
                      }`}
                    >
                      {STAGE_METADATA[stage].shortLabel}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {isCurrent ? (
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                          In Progress
                        </span>
                      ) : isClosedPoint ? (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                          Closed
                        </span>
                      ) : isCompleted && dateStr ? (
                        dateStr
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="md:hidden">
        <ol className="space-y-0">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted =
              idx < activeIndex || (isHired && idx === activeIndex);
            const isCurrent = idx === activeIndex && !isHired && !isRejected;
            const isClosedPoint = idx === activeIndex && isRejected;
            const isLast = idx === PIPELINE_STAGES.length - 1;
            const dateStr = formatShortDate(
              isClosedPoint
                ? stageDates["Rejected"] || application.updatedAt
                : stageDates[stage]
            );

            return (
              <li key={stage} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast && (
                  <div
                    className={`absolute left-4 top-9 -bottom-1 w-0.5 ${
                      idx < activeIndex
                        ? isHired
                          ? "bg-emerald-500"
                          : "bg-indigo-600"
                        : "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />
                )}

                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                    isCompleted
                      ? isHired
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-indigo-600 bg-indigo-600 text-white"
                      : isCurrent
                      ? "border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-50"
                      : isClosedPoint
                      ? "border-rose-400 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : isClosedPoint ? (
                    <XCircle className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-between pt-1">
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isCompleted || isCurrent
                          ? "text-slate-900"
                          : isClosedPoint
                          ? "text-rose-700"
                          : "text-slate-400"
                      }`}
                    >
                      {STAGE_METADATA[stage].label}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    {isCurrent ? (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700">
                        In Progress
                      </span>
                    ) : isClosedPoint ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-medium text-rose-700">
                        Closed
                      </span>
                    ) : isCompleted && dateStr ? (
                      <span className="text-slate-500">{dateStr}</span>
                    ) : (
                      <span className="text-slate-400">Upcoming</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
