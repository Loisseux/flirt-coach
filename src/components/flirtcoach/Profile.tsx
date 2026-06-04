import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPrivacyPolicyUrl,
  getTermsUrl,
  openInBrowser,
  openSupportEmail,
} from "@/lib/legal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function Profile({ onBack }: { onBack: () => void }) {
  const { user, signOut, deleteAccount } = useAuth();
  const email = user?.email ?? "Unknown";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleLogout() {
    await signOut();
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    setDeleting(false);

    if (result.error) {
      setDeleteError(result.error);
      return;
    }

    setConfirmOpen(false);
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

      <div className="fc-glass mt-6 overflow-hidden rounded-2xl">
        <LegalLink
          label="Privacy Policy"
          onClick={() => void openInBrowser(getPrivacyPolicyUrl())}
        />
        <LegalLink
          label="Terms of Service"
          onClick={() => void openInBrowser(getTermsUrl())}
        />
        <LegalLink label="Contact Us" onClick={() => void openSupportEmail()} last />
      </div>

      <div className="flex-1" />

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="fc-glass w-full rounded-2xl py-4 text-base font-semibold text-pink-400 active:scale-[0.98]"
        >
          Log out
        </button>

        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setConfirmOpen(true);
          }}
          className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 py-4 text-base font-semibold text-red-400 active:scale-[0.98]"
        >
          Delete account
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[340px] border-white/10 bg-[#13162a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently delete your account, all conversations, and all messages. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAccount();
              }}
              className="w-full rounded-2xl border-0 bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
            <AlertDialogCancel
              disabled={deleting}
              className="w-full rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LegalLink({
  label,
  onClick,
  last = false,
}: {
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-white active:bg-white/5 ${
        last ? "" : "border-b border-white/5"
      }`}
    >
      {label}
      <span className="text-white/40">→</span>
    </button>
  );
}
