import { useAuth } from "@/contexts/AuthContext";

export function Profile({ onBack }: { onBack: () => void }) {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "Unknown";

  async function handleLogout() {
    await signOut();
  }

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col px-5 pt-4">
      <header className="mb-8 flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-2xl text-white/80 active:scale-90">
          ←
        </button>
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <div className="fc-glass rounded-2xl p-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
          Email
        </div>
        <div className="text-base text-white">{email}</div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => void handleLogout()}
        className="fc-glass w-full rounded-2xl py-4 text-base font-semibold text-pink-400 active:scale-[0.98]"
      >
        Log out
      </button>
    </div>
  );
}
