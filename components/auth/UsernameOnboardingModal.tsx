"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, Examination } from "@/types/database";

export const UsernameOnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [exams, setExams] = useState<Examination[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [examId, setExamId] = useState("exam-ssc-cgl");
  const [status, setStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          setExams(data.exams || []);
          setName(data.user.display_name || "");
          setExamId(data.user.preferred_examination_id || "exam-ssc-cgl");

          // Open onboarding if user does not have a username set
          if (!data.user.username || data.user.username.trim() === "") {
            setIsOpen(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setUsername(clean);
    setError(null);

    if (clean.length < 3) {
      setStatus({ checking: false, available: false, message: "Username must be 3-30 characters" });
      return;
    }
    if (clean.startsWith(".") || clean.endsWith(".") || clean.includes("..")) {
      setStatus({ checking: false, available: false, message: "Cannot start/end with a dot or have consecutive dots" });
      return;
    }

    setStatus({ checking: true, available: null, message: "Checking availability..." });
    fetch(`/api/profile?checkUsername=${encodeURIComponent(clean)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (d.available) {
            setStatus({ checking: false, available: true, message: `@${clean} is available!` });
          } else {
            setStatus({ checking: false, available: false, message: `@${clean} is already taken` });
          }
        }
      })
      .catch(() => {
        setStatus({ checking: false, available: null, message: "" });
      });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!username.trim() || username.length < 3) {
      setError("Please enter a valid unique username (at least 3 characters)");
      return;
    }
    if (username.startsWith(".") || username.endsWith(".") || username.includes("..")) {
      setError("Username cannot start or end with a dot, or contain consecutive dots");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const selectedExam = exams.find((x) => x.id === examId);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name.trim(),
          username: username.trim().toLowerCase(),
          preferred_examination_id: examId,
          target_exam: selectedExam?.name || "SSC CGL",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setIsOpen(false);
      } else {
        setError(data.error || "Failed to save username. Please choose another.");
      }
    } catch {
      setError("Network error while creating profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high/60 flex flex-col gap-4 animate-in zoom-in-95">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-primary/20 bg-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Qz Loop" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Welcome to Qz Loop!
          </h2>
          <p className="font-body-sm text-body-sm text-secondary">
            Set up your Instagram-style unique username, name, and target exam to start practicing.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5 pt-1">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Unique Username */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                Unique Username
              </label>
              <span className="text-[11px] text-secondary">Must be unique</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-secondary text-sm">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="choose_username"
                className={`w-full pl-8 pr-10 py-2.5 rounded-xl bg-surface-container-low border text-sm font-bold tracking-wide focus:outline-none ${
                  status.available === true
                    ? "border-emerald-600 text-emerald-950 dark:text-emerald-100"
                    : status.available === false
                    ? "border-error text-error"
                    : "border-surface-container-high/60 text-on-surface focus:border-primary"
                }`}
              />
              {status.checking && (
                <div className="absolute right-3.5 top-3 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              {status.available === true && (
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-emerald-600 text-[20px]">
                  check_circle
                </span>
              )}
              {status.available === false && (
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-error text-[20px]">
                  cancel
                </span>
              )}
            </div>
            {status.message && (
              <p
                className={`text-[11px] font-medium mt-0.5 ${
                  status.available === true
                    ? "text-emerald-600"
                    : status.available === false
                    ? "text-error"
                    : "text-secondary"
                }`}
              >
                {status.message}
              </p>
            )}
          </div>

          {/* Target Exam */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
              Target Examination
            </label>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              {exams.length > 0 ? (
                exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))
              ) : (
                <option value="exam-ssc-cgl">SSC CGL</option>
              )}
            </select>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || status.available === false || !username.trim()}
            className="w-full mt-2 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-primary-container active:scale-95 transition-all disabled:opacity-40"
          >
            {isSaving ? "Creating Profile..." : "Claim Username & Start"}
          </button>
        </form>
      </div>
    </div>
  );
};
