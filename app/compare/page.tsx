import type { Metadata } from "next";
import { CompareView } from "@/components/compare-view";

export const metadata: Metadata = { title: "Compare calls" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string; a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const initialCaseId = params.case ?? params.a;
  return <CompareView initialCaseId={initialCaseId} />;
}
