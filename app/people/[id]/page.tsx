import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersonProfileView } from "@/components/person-profile-view";
import { allPersonProfileIds, getPersonProfile } from "@/data/profiles";

export function generateStaticParams() {
  return allPersonProfileIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = getPersonProfile(id);
  if (!profile) return { title: "Profile" };
  return { title: `${profile.publisher.displayName} · Profile` };
}

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = getPersonProfile(id);
  if (!profile) notFound();
  return <PersonProfileView profile={profile} />;
}
