type AppErrorFallbackProps = {
  message?: string;
  onRetry?: () => void;
};

export function AppErrorFallback({ message, onRetry }: AppErrorFallbackProps) {
  return (
    <div className="fc-app-shell mx-auto flex w-full max-w-[430px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl fc-gradient text-2xl">
        ⚠️
      </div>
      <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-white/60">
        Quippr couldn&apos;t load. Try again or restart the app.
      </p>
      {message && import.meta.env.DEV && (
        <p className="mt-3 max-w-full break-words text-left text-xs text-pink-400/80">{message}</p>
      )}
      <button
        type="button"
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
        className="fc-gradient mt-6 w-full max-w-xs rounded-2xl py-3.5 text-sm font-semibold text-white active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
