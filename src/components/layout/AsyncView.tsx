import type { ReactNode } from "react";
import type { AsyncState } from "@/data/inventory-store";
import { Button } from "@/components/ui/button";

type AsyncViewProps<T> = {
  state: AsyncState<T>;
  onRetry: () => void;
  /** Visual skeleton/placeholder rendered while `state.status === "loading"`; kept aria-hidden. */
  loading: ReactNode;
  /** Screen-reader-only status text announced while loading. */
  loadingLabel?: string;
  /** Rendered while `state.status === "ready"`. */
  children: (data: T) => ReactNode;
  /** Optional override for the error state; defaults to a message + Retry button. */
  renderError?: (message: string, retry: () => void) => ReactNode;
};

/** Generic loading/error/ready renderer for anything backed by an AsyncState. */
export function AsyncView<T>({ state, onRetry, loading, loadingLabel = "Loading…", children, renderError }: AsyncViewProps<T>) {
  if (state.status === "loading") {
    return (
      <div role="status">
        <span className="sr-only">{loadingLabel}</span>
        <div aria-hidden="true">{loading}</div>
      </div>
    );
  }
  if (state.status === "error") {
    return renderError ? <>{renderError(state.message, onRetry)}</> : <DefaultError message={state.message} onRetry={onRetry} />;
  }
  return <>{children(state.data)}</>;
}

function DefaultError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 border border-dashed border-line px-6 py-24 text-center">
      <p className="max-w-md text-ivory/65">{message}</p>
      <Button variant="luxe-outline" size="xl" className="text-ivory" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
