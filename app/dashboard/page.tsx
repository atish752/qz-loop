import { HomeDashboardView } from "@/components/home/HomeDashboardView";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardPage() {
  return (
    <main className="w-full flex-1 flex flex-col relative min-h-screen">
      <HomeDashboardView />
      <BottomNav />
    </main>
  );
}
