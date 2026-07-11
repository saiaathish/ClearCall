import { Suspense } from "react";
import { FeedView } from "@/components/feed-view";

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="feed-page"><div className="loading-skeleton" style={{ minHeight: 640 }} /></div>}>
      <FeedView />
    </Suspense>
  );
}
