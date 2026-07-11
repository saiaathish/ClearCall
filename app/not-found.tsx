import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-shell not-found-state">
      <div className="empty-state">
        <div>
          <span className="empty-state__icon" aria-hidden="true"><SearchX size={23} /></span>
          <h1 className="section-title">That route is out of play</h1>
          <p>The page does not exist in this ClearCall prototype.</p>
          <Link className="button" href="/"><ArrowLeft size={16} /> Return to the feed</Link>
        </div>
      </div>
    </div>
  );
}
