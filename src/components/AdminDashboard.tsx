"use client";

import { ALL_STAGES, STAGE_METADATA } from "@/lib/config";
import { ApplicationStage, JobApplication } from "@/lib/types";
import {
  AlertCircle,
  Check,
  Copy,
  Database,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

interface AdminDashboardProps {
  initialAuthenticated: boolean;
}

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminDashboard({
  initialAuthenticated,
}: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<ApplicationStage | "ALL">(
    "ALL"
  );

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newLocation, setNewLocation] = useState("Singapore (Hybrid)");
  const [newStage, setNewStage] = useState<ApplicationStage>("Applied");
  const [newNote, setNewNote] = useState("");

  // Edit modal state
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStage, setEditStage] = useState<ApplicationStage>("Applied");
  const [editNote, setEditNote] = useState("");

  // Per-row states
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/applications");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to load applications.");
        return;
      }
      setApplications(data.applications || []);
    } catch {
      setActionError("Network error while loading applications.");
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      void fetchApplications();
    }
  }, [authenticated, fetchApplications]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Invalid password.");
        return;
      }
      setPassword("");
      setAuthenticated(true);
    } catch {
      setAuthError("Unable to reach server. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setApplications([]);
  };

  const handleSeedSamples = async () => {
    setSeeding(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to seed sample data.");
        return;
      }
      setApplications(data.applications || []);
    } catch {
      setActionError("Network error while seeding sample data.");
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName: newName,
          email: newEmail,
          jobTitle: newJobTitle,
          department: newDepartment,
          location: newLocation,
          currentStage: newStage,
          candidateNote: newNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to create application.");
        return;
      }
      setApplications((prev) => [data.application, ...prev]);
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewJobTitle("");
      setNewDepartment("");
      setNewLocation("Singapore (Hybrid)");
      setNewStage("Applied");
      setNewNote("");
    } catch {
      setActionError("Network error while creating application.");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickStageChange = async (
    id: string,
    nextStage: ApplicationStage
  ) => {
    setUpdatingId(id);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/applications/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentStage: nextStage }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to update stage.");
        return;
      }
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? data.application : app))
      );
    } catch {
      setActionError("Network error while updating stage.");
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setEditName(app.applicantName);
    setEditEmail(app.email);
    setEditJobTitle(app.jobTitle);
    setEditDepartment(app.department);
    setEditLocation(app.location);
    setEditStage(app.currentStage);
    setEditNote(app.candidateNote || "");
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setSavingEdit(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/applications/${encodeURIComponent(editingApp.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicantName: editName,
            email: editEmail,
            jobTitle: editJobTitle,
            department: editDepartment,
            location: editLocation,
            currentStage: editStage,
            candidateNote: editNote,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to update application.");
        return;
      }
      setApplications((prev) =>
        prev.map((app) => (app.id === editingApp.id ? data.application : app))
      );
      setEditingApp(null);
    } catch {
      setActionError("Network error while saving changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete application ${id}? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/applications/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || "Failed to delete application.");
        return;
      }
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch {
      setActionError("Network error while deleting application.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyShareLink = async (app: JobApplication) => {
    const url = `${window.location.origin}/?id=${encodeURIComponent(
      app.id
    )}&email=${encodeURIComponent(app.email)}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(app.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (stageFilter !== "ALL" && app.currentStage !== stageFilter) {
        return false;
      }
      if (!q) return true;
      return (
        app.id.toLowerCase().includes(q) ||
        app.applicantName.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q) ||
        app.department.toLowerCase().includes(q)
      );
    });
  }, [applications, searchQuery, stageFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      active: applications.filter(
        (a) => a.currentStage !== "Hired" && a.currentStage !== "Rejected"
      ).length,
      interview: applications.filter((a) => a.currentStage === "Interview")
        .length,
      offerOrHired: applications.filter(
        (a) => a.currentStage === "Offer" || a.currentStage === "Hired"
      ).length,
    };
  }, [applications]);

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900">
            Recruiter Admin Sign-In
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your admin password to manage applicants and update hiring
            stages.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="adminPassword"
                className="block text-sm font-semibold text-slate-800"
              >
                Admin Password
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="adminPassword"
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Recruiter Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Add candidates, update hiring stages, and share status lookup links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedSamples}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4 text-indigo-600" />
            )}
            <span>Seed Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add Applicant</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Applicants</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Pipeline</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">
            {stats.active}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">In Interview</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {stats.interview}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Offer / Hired</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {stats.offerOrHired}
          </p>
        </div>
      </div>

      {actionError && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStageFilter("ALL")}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              stageFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({applications.length})
          </button>
          {ALL_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                stageFilter === stage
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {STAGE_METADATA[stage].shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {loadingApps ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              {applications.length === 0
                ? "No applications yet"
                : "No matching applications"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {applications.length === 0
                ? 'Click "Add Applicant" or "Seed Sample Data" to populate your pipeline.'
                : "Try adjusting your search query or stage filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Application ID</th>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Role &amp; Team</th>
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => {
                  const meta = STAGE_METADATA[app.currentStage];
                  return (
                    <tr
                      key={app.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-800">
                        {app.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {app.applicantName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {app.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {app.jobTitle}
                        </div>
                        <div className="text-xs text-slate-500">
                          {app.department} &bull; {app.location}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`Stage for ${app.applicantName}`}
                            value={app.currentStage}
                            disabled={updatingId === app.id}
                            onChange={(e) =>
                              handleQuickStageChange(
                                app.id,
                                e.target.value as ApplicationStage
                              )
                            }
                            className={`rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold focus:border-indigo-600 focus:outline-none ${meta.badgeClass}`}
                          >
                            {ALL_STAGES.map((s) => (
                              <option
                                key={s}
                                value={s}
                                className="bg-white text-slate-900"
                              >
                                {s}
                              </option>
                            ))}
                          </select>
                          {updatingId === app.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatShortDate(app.updatedAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyShareLink(app)}
                            title="Copy direct candidate lookup link"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {copiedId === app.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={`/?id=${encodeURIComponent(
                              app.id
                            )}&email=${encodeURIComponent(app.email)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Preview candidate view"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => openEditModal(app)}
                            title="Edit details & recruiter note"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === app.id}
                            onClick={() => handleDelete(app.id)}
                            title="Delete application"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            {deletingId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Applicant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Add New Applicant
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. Cloud Architect"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Singapore (Hybrid)"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Initial Stage
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) =>
                      setNewStage(e.target.value as ApplicationStage)
                    }
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  >
                    {ALL_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Note Visible to Candidate (optional)
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Thank you for applying! Our recruiter will review your profile within 3 business days."
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Create Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Applicant Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Edit Application
                </h2>
                <p className="font-mono text-xs text-slate-500">
                  {editingApp.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Current Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) =>
                      setEditStage(e.target.value as ApplicationStage)
                    }
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  >
                    {ALL_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Note Visible to Candidate
                </label>
                <textarea
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Share next steps, interview times, or feedback..."
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
