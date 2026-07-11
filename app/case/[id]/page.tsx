import type { Metadata } from "next";
import { cases } from "@/data/cases";
import { CaseDetailView } from "@/components/case-detail-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const scenario = cases.find((item) => item.id === id || item.slug === id);
  return { title: scenario?.title ?? "Case review" };
}

export function generateStaticParams() {
  return cases.map((item) => ({ id: item.id }));
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseDetailView caseId={id} />;
}
