import { ProfileView } from "@/components/profile/ProfileView";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ProfilePage() {
  return (
    <main className="w-full flex-1 flex flex-col relative min-h-screen">
      <ProfileView />
      <BottomNav />
    </main>
  );
}
