import { QuizLoopContainer } from "@/components/loop/QuizLoopContainer";
import { BottomNav } from "@/components/layout/BottomNav";

export default function QuizLoopPage() {
  return (
    <main className="w-full flex-1 flex flex-col relative h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-surface">
      <QuizLoopContainer />
      <BottomNav />
    </main>
  );
}
