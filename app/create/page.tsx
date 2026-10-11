import { CreateQuestionView } from "@/components/create/CreateQuestionView";
import { BottomNav } from "@/components/layout/BottomNav";

export default function CreateQuestionPage() {
  return (
    <main className="w-full flex-1 flex flex-col relative min-h-screen">
      <CreateQuestionView />
      <BottomNav />
    </main>
  );
}
