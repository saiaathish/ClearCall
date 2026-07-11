"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("ClearCall route error", error);
  }, [error]);

  return (
    <div className="page-shell not-found-state">
      <div className="empty-state">
        <div>
          <span className="empty-state__icon" aria-hidden="true"><CircleAlert size={23} /></span>
          <h1 className="section-title">This view could not be loaded</h1>
          <p>Your local demo data is still in this browser. Retry the view or return to the feed.</p>
          <div className="button-row" style={{ justifyContent: "center" }}>
            <button className="button" type="button" onClick={reset}><RotateCcw size={16} /> Retry</button>
            <Link className="button button--secondary" href="/">Return to feed</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
