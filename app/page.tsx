import { FeedContainer } from "@/components/feed/FeedContainer";
import { BottomNav } from "@/components/layout/BottomNav";

export default function HomePage() {
  return (
    <main className="w-full flex-1 flex flex-col relative min-h-screen">
      <FeedContainer />
      <BottomNav />
    </main>
  );
}
