import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { BottomNav } from "@/components/layout/BottomNav";

export default function LeaderboardPage() {
  return (
    <main className="w-full flex-1 flex flex-col relative min-h-screen">
      <LeaderboardView />
      <BottomNav />
    </main>
  );
}
