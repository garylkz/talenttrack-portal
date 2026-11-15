"use client";

import { STAGE_METADATA } from "@/lib/config";
import { JobApplication } from "@/lib/types";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Copy,
  FileSearch,
  History,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import StageTimeline from "./StageTimeline";

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-SG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ApplicantPortal() {
  const searchParams = useSearchParams();
  const [applicationId, setApplicationId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const hasAutoFetched = useRef(false);

  const performLookup = useCallback(async (idVal: string, emailVal: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/applications/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: idVal.trim(),
          email: emailVal.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not find a matching application.");
        setApplication(null);
        return;
      }

      setApplication(data.application);
    } catch {
      setError(
        "Network error while checking status. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const paramId = searchParams.get("id") || "";
    const paramEmail = searchParams.get("email") || "";
    if (paramId) setApplicationId(paramId.toUpperCase());
    if (paramEmail) setEmail(paramEmail);

    if (paramId && paramEmail && !hasAutoFetched.current) {
      hasAutoFetched.current = true;
      void performLookup(paramId, paramEmail);
    }
  }, [searchParams, performLookup]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await performLookup(applicationId, email);
  };

  const handleCopyId = async () => {
    if (!application) return;
    await navigator.clipboard.writeText(application.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (application) {
    const stageMeta = STAGE_METADATA[application.currentStage];
    const reversedHistory = [...(application.history || [])].reverse();

    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Top Action Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setApplication(null);
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Look up another application</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => performLookup(application.id, application.email)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh status</span>
          </button>
        </div>

        {/* Main Header Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-7 text-white sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-indigo-200">
                  Candidate Application Portal &bull; {application.applicantName}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {application.jobTitle}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-300" />
                    {application.department}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-indigo-300" />
                    {application.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-300" />
                    Applied {formatDateOnly(application.appliedAt)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Application ID"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-mono font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <span>{application.id}</span>
                {copiedId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {/* Current Status Banner */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${stageMeta.badgeClass}`}
              >
                Current Status: {stageMeta.label}
              </span>
              <span className="text-xs text-slate-500">
                Last updated {formatDateTime(application.updatedAt)}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {stageMeta.headline}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {stageMeta.description}
            </p>

            {/* Recruiter Note / Next Steps */}
            {application.candidateNote && (
              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <MessageSquareText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-900">
                      Update from Recruiting Team
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                      {application.candidateNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Stage Progress Timeline */}
            <div className="mt-8 border-t border-slate-100 pt-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Application Stage Timeline
                </h3>
              </div>
              <StageTimeline application={application} />
            </div>
          </div>
        </div>

        {/* Stage History Log */}
        {reversedHistory.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-slate-900">
              <History className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-semibold">Application History</h3>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {reversedHistory.map((entry, index) => {
                const entryMeta = STAGE_METADATA[entry.stage];
                return (
                  <div
                    key={`${entry.stage}-${entry.updatedAt}-${index}`}
                    className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${entryMeta.badgeClass}`}
                        >
                          {entryMeta.label}
                        </span>
                        {index === 0 && (
                          <span className="text-xs font-medium text-slate-400">
                            Latest
                          </span>
                        )}
                      </div>
                      {entry.note && (
                        <p className="mt-1.5 text-sm text-slate-600">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 text-xs text-slate-400 sm:pt-0.5">
                      {formatDateTime(entry.updatedAt)}
                    </time>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden">
      {/* Decorative Soft Gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 transform-gpu overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div className="mx-auto aspect-[1155/678] w-[64rem] bg-gradient-to-tr from-indigo-200 via-sky-100 to-purple-200 opacity-45" />
      </div>

      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Hero Copy */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 ring-1 ring-indigo-600/20">
            <FileSearch className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Track Your Application
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Enter your Application ID and the email address you applied with to
            view your real-time hiring progress.
          </p>
        </div>

        {/* Lookup Form Card */}
        <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="applicationId"
                className="block text-sm font-semibold text-slate-800"
              >
                Application ID
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <input
                  id="applicationId"
                  name="applicationId"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. APP-2026-1042"
                  value={applicationId}
                  onChange={(e) =>
                    setApplicationId(e.target.value.toUpperCase())
                  }
                  className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 font-mono text-sm uppercase text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Provided in your application confirmation message.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-800"
              >
                Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking Application...</span>
                </>
              ) : (
                <>
                  <span>View Application Status</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Stage Overview Info Strip */}
        <div className="mt-8 rounded-xl border border-slate-200/70 bg-white/70 px-5 py-4 text-center backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-500">
            Our standard hiring pipeline:{" "}
            <span className="font-semibold text-slate-700">
              Applied &rarr; Screening &rarr; Interview &rarr; Offer &rarr;
              Hired
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
