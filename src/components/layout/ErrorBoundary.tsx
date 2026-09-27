import { Component, type ErrorInfo, type ReactNode } from "react";
import { SHOWROOM_PHONE } from "@/lib/contact";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Last line of defence against a render crash. Class component because React
 * still has no hook equivalent; App keys it by pathname so navigating away resets it.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[HP Auto] Page crashed", error, info.componentStack);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section role="alert" className="flex min-h-[80svh] flex-col items-center justify-center px-5 pt-20 text-center">
        <p className="eyebrow text-champagne">A small misfire</p>
        <h1 className="mt-5 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
          Something went wrong loading this page.
        </h1>
        <p className="mt-6 text-ivory/65">
          Please try again. If it keeps happening, the concierge is on {SHOWROOM_PHONE}.
        </p>
        {/* Plain anchor: a full reload is the most reliable recovery after a crash. */}
        <a href="/inventory" className="eyebrow mt-10 bg-champagne px-8 py-4 text-ink hover:bg-ivory">
          Return to the collection
        </a>
      </section>
    );
  }
}
