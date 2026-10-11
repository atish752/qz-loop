import { MatrixView } from "@/components/matrix/MatrixView";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MatrixPage() {
  return (
    <main className="w-full flex-1 flex flex-col relative min-h-screen">
      <MatrixView />
      <BottomNav />
    </main>
  );
}
