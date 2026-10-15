import { SocialView } from "@/components/social/SocialView";
import { BottomNav } from "@/components/layout/BottomNav";

export default function SocialPage() {
  return (
    <main className="w-full flex-1 flex flex-col relative min-h-screen bg-surface">
      <SocialView />
      <BottomNav />
    </main>
  );
}
