import type { Metadata } from "next";
import { CompareView } from "@/components/compare-view";

export const metadata: Metadata = { title: "Compare cases" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  return <CompareView initialA={a} initialB={b} />;
}
