"use client";

import React, { useState, useEffect } from "react";
import { LeaderboardEntry } from "@/types/database";
import { TopHeader } from "../layout/TopHeader";

export const LeaderboardView: React.FC = () => {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [scoringRule, setScoringRule] = useState<{
    formula: string;
    description: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStandings(data.standings);
          setScoringRule(data.scoringRule);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [period]);

  const qualifiedStandings = standings.filter((s) => s.is_qualified !== false);
  const unqualifiedCurrentUser = standings.find((s) => s.is_current_user && s.is_qualified === false);
  const top3 = qualifiedStandings.slice(0, 3);
  const remainder = qualifiedStandings.slice(3);

  const medalEmojis = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopHeader currentTab="leaderboard" streakDays={14} activeExamName="NEET UG (Medical Entrance)" />

      <div className="flex flex-col w-full px-4 pt-3 pb-6">
        {/* Title & Live Badge */}
        <div className="flex flex-col gap-1 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
              {period === "weekly" ? "Weekly Standings" : "Monthly Standings"}
            </h1>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary-container bg-surface-container-high px-2.5 py-1 rounded-full font-bold">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              Live Cycle
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary">
            NEET UG Practice Sprint • Minimum 20 solves to qualify • Genuine verified attempts
          </p>
        </div>

        {/* Tab Toggle: This Week | This Month */}
        <div className="flex items-center p-1 bg-surface-container-high rounded-xl gap-1 mb-3">
          <button
            onClick={() => setPeriod("weekly")}
            className={`flex-1 py-1.5 rounded-lg font-label-md text-label-md text-center transition-all ${
              period === "weekly"
                ? "bg-primary-container text-on-primary shadow-sm font-bold"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`flex-1 py-1.5 rounded-lg font-label-md text-label-md text-center transition-all ${
              period === "monthly"
                ? "bg-primary-container text-on-primary shadow-sm font-bold"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            This Month
          </button>
        </div>

        {/* Scoring Formula Transparency Note */}
        {scoringRule && (
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-secondary font-body-sm text-body-sm flex items-start gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-on-surface">Deterministic Scoring Formula</span>
              <span className="text-xs mt-0.5">{scoringRule.formula}</span>
              <span className="text-[11px] text-secondary mt-0.5">
                Participation Threshold: 20 submitted answers in period required for ranked AIR qualification.
              </span>
            </div>
          </div>
        )}

        {/* Current User Qualification Status Banner (if not yet reached 20 attempts) */}
        {unqualifiedCurrentUser && (
          <div className="p-3 rounded-xl bg-primary-fixed/40 border border-primary/20 mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">flag</span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm font-bold text-on-surface truncate">
                  Rank Qualification Progress: {unqualifiedCurrentUser.total_attempts} / 20 attempts
                </span>
                <span className="text-xs text-secondary truncate">
                  Solve {20 - unqualifiedCurrentUser.total_attempts} more questions to enter the ranked leaderboard!
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-bold text-[11px] shrink-0">
              {Math.round((unqualifiedCurrentUser.total_attempts / 20) * 100)}%
            </span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p className="font-body-sm text-body-sm text-secondary">Calculating ranks from verified attempts...</p>
          </div>
        ) : qualifiedStandings.length === 0 ? (
          /* Empty state when no learners qualify */
          <div className="my-8 p-6 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-3 border border-surface-container-high/40">
            <span className="material-symbols-outlined text-[40px] text-tertiary">military_tech</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No Qualified Aspirants Yet</h3>
            <p className="font-body-md text-body-md text-secondary max-w-xs">
              Complete at least 20 practice questions during this {period === "weekly" ? "week" : "month"} to earn your AIR Rank #1!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {/* Top 3 Podium Cards */}
            {top3.map((entry, idx) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-3.5 rounded-xl shadow-xs border transition-transform ${
                  entry.is_current_user
                    ? "bg-primary-fixed/30 border-primary/40 ring-1 ring-primary/40"
                    : "bg-surface-container-low border-surface-container-high/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center font-headline-sm text-headline-sm shrink-0 shadow-xs">
                    {medalEmojis[idx]}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-label-lg text-label-lg text-on-surface truncate">
                        {entry.display_name}
                      </span>
                      {entry.username && (
                        <span className="font-label-sm text-label-sm text-primary font-bold">
                          @{entry.username}
                        </span>
                      )}
                      {entry.is_current_user && (
                        <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                          YOU
                        </span>
                      )}
                      <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
                        verified
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-secondary flex-wrap">
                      <span className="font-bold text-on-surface">AIR #{entry.rank}</span>
                      <span>•</span>
                      <span>{entry.total_attempts} solves</span>
                      <span>•</span>
                      <span>{entry.correct_count} correct ({entry.accuracy_percentage}%)</span>
                      <span>•</span>
                      <span>{entry.avg_time_seconds}s avg</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    PTS
                  </span>
                </div>
              </div>
            ))}

            {/* Remaining Ranked Students (AIR 4+) */}
            {remainder.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  entry.is_current_user
                    ? "bg-primary-fixed/30 border-primary/40 ring-1 ring-primary/40"
                    : "bg-surface-container-low border-surface-container-high/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-md text-label-md font-bold text-secondary shrink-0">
                    #{entry.rank}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                        {entry.display_name}
                      </span>
                      {entry.username && (
                        <span className="font-label-sm text-label-sm text-primary font-bold">
                          @{entry.username}
                        </span>
                      )}
                      {entry.is_current_user && (
                        <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary truncate">
                      {entry.total_attempts} attempts · {entry.correct_count} correct ({entry.accuracy_percentage}%) · {entry.avg_time_seconds}s avg
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">PTS</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
