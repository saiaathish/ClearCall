import type { Publisher, UserRole } from "@/lib/types";

export interface FeedPersonSeed {
  displayName: string;
  role: UserRole;
  organization?: string;
  isVerified?: boolean;
  /** Index into /media/avatars/avatar-XX.svg */
  avatarIndex: number;
}

/** Diverse fictional demo names — picked by seeded RNG, not hardcoded repeats. */
export const FEED_PEOPLE: readonly FeedPersonSeed[] = [
  { displayName: "Maya Chen", role: "referee", organization: "Metro Youth League", avatarIndex: 0 },
  { displayName: "Omar Haddad", role: "educator", organization: "Referee academy desk", isVerified: true, avatarIndex: 1 },
  { displayName: "Priya Nair", role: "learner", avatarIndex: 2 },
  { displayName: "Jonas Berg", role: "referee", organization: "County assessor panel", avatarIndex: 3 },
  { displayName: "Aisha Okonkwo", role: "verified_referee", organization: "State association", isVerified: true, avatarIndex: 4 },
  { displayName: "Leo Martins", role: "learner", avatarIndex: 5 },
  { displayName: "Harper Quinn", role: "referee", avatarIndex: 6 },
  { displayName: "Diego Alvarez", role: "educator", organization: "Clinic instructor pool", avatarIndex: 7 },
  { displayName: "Sofia Rossi", role: "learner", avatarIndex: 8 },
  { displayName: "Kenji Watanabe", role: "referee", organization: "High school assignors", avatarIndex: 9 },
  { displayName: "Amelia Brooks", role: "verified_referee", isVerified: true, avatarIndex: 10 },
  { displayName: "Noah Ibrahim", role: "learner", avatarIndex: 11 },
  { displayName: "Elena Popov", role: "referee", avatarIndex: 12 },
  { displayName: "Caleb Nguyen", role: "educator", organization: "Laws clinic", avatarIndex: 13 },
  { displayName: "Fatima Al-Rashid", role: "referee", avatarIndex: 14 },
  { displayName: "Marcus Doyle", role: "learner", avatarIndex: 15 },
  { displayName: "Ines Duarte", role: "verified_referee", organization: "Regional panel", isVerified: true, avatarIndex: 16 },
  { displayName: "Theo Lambert", role: "referee", avatarIndex: 17 },
  { displayName: "Yuki Tanaka", role: "learner", avatarIndex: 18 },
  { displayName: "Grace Mwangi", role: "educator", organization: "Grassroots mentor desk", avatarIndex: 19 },
  { displayName: "Rohan Kapoor", role: "referee", avatarIndex: 20 },
  { displayName: "Chloe Sanders", role: "learner", avatarIndex: 21 },
  { displayName: "Andre Silva", role: "verified_referee", isVerified: true, avatarIndex: 22 },
  { displayName: "Nora Lindqvist", role: "referee", organization: "U19 development", avatarIndex: 23 },
  { displayName: "Jamal Wright", role: "learner", avatarIndex: 24 },
  { displayName: "Lucia Fernández", role: "educator", avatarIndex: 25 },
  { displayName: "Ethan Park", role: "referee", avatarIndex: 26 },
  { displayName: "Zara Khan", role: "learner", avatarIndex: 27 },
  { displayName: "Felix Hartmann", role: "referee", organization: "Adult recreational", avatarIndex: 28 },
  { displayName: "Camila Soto", role: "verified_referee", isVerified: true, avatarIndex: 29 },
  { displayName: "Benji Cole", role: "learner", avatarIndex: 30 },
  { displayName: "Ananya Shah", role: "educator", organization: "Rule interpretation lab", avatarIndex: 31 },
  { displayName: "Owen McCarthy", role: "referee", avatarIndex: 32 },
  { displayName: "Mei Ling", role: "learner", avatarIndex: 33 },
  { displayName: "Santiago Ruiz", role: "referee", avatarIndex: 34 },
  { displayName: "Hannah Vogel", role: "verified_referee", organization: "Assessor corps", isVerified: true, avatarIndex: 35 },
  { displayName: "Idris Bello", role: "learner", avatarIndex: 36 },
  { displayName: "Claire Dubois", role: "referee", avatarIndex: 37 },
  { displayName: "Mateo Costa", role: "educator", avatarIndex: 38 },
  { displayName: "Riley Fox", role: "learner", avatarIndex: 39 },
  { displayName: "Nadia Petrova", role: "referee", organization: "College club circuit", avatarIndex: 40 },
  { displayName: "Hugo Jensen", role: "learner", avatarIndex: 41 },
  { displayName: "Amara Diallo", role: "verified_referee", isVerified: true, avatarIndex: 42 },
  { displayName: "Sean O'Neill", role: "referee", avatarIndex: 43 },
  { displayName: "Valentina Ricci", role: "educator", organization: "Instructor network", avatarIndex: 44 },
  { displayName: "Kai Nakamura", role: "learner", avatarIndex: 45 },
  { displayName: "Isabelle Moreau", role: "referee", avatarIndex: 46 },
  { displayName: "Tariq Hassan", role: "learner", avatarIndex: 47 },
  { displayName: "Emma Johansson", role: "referee", organization: "Youth development", avatarIndex: 48 },
  { displayName: "Luis Ortega", role: "verified_referee", isVerified: true, avatarIndex: 49 },
  { displayName: "ClearCall demo desk", role: "educator", organization: "Authored product prototype", avatarIndex: 50 },
  { displayName: "Sam Rivera", role: "referee", avatarIndex: 51 },
  { displayName: "Nia Patel", role: "learner", avatarIndex: 52 },
  { displayName: "Jordan Lee", role: "learner", avatarIndex: 53 },
  { displayName: "Ava Kim", role: "referee", avatarIndex: 54 },
  { displayName: "Miles Carter", role: "educator", avatarIndex: 55 },
  { displayName: "Layla Hassan", role: "learner", avatarIndex: 56 },
  { displayName: "Brett Olson", role: "referee", avatarIndex: 57 },
  { displayName: "Sienna Walsh", role: "verified_referee", isVerified: true, avatarIndex: 58 },
  { displayName: "Devon Price", role: "learner", avatarIndex: 59 },
] as const;

export function avatarSrcForIndex(index: number): string {
  const clamped = ((index % 80) + 80) % 80;
  return `/media/avatars/avatar-${String(clamped).padStart(2, "0")}.svg`;
}

export function initialsForName(displayName: string): string {
  const parts = displayName
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "CC";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function personToPublisher(person: FeedPersonSeed, idSuffix: string): Publisher {
  return {
    id: `publisher-${idSuffix}`,
    displayName: person.displayName,
    role: person.role,
    organization: person.organization,
    avatarInitials: initialsForName(person.displayName),
    avatarSrc: avatarSrcForIndex(person.avatarIndex),
    isVerified: Boolean(person.isVerified),
    isSynthetic: true,
    disclosure:
      person.role === "educator" && person.displayName === "ClearCall demo desk"
        ? "Fictional demo publisher; no credential or affiliation is claimed."
        : "Fictional demo participant; no credential is claimed.",
  };
}

/** Stable seeded RNG so the same case always draws the same people. */
export function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function pickPeople(seed: string, count: number, excludeNames: readonly string[] = []): FeedPersonSeed[] {
  const random = seededRandom(seed);
  const blocked = new Set(excludeNames);
  const pool = FEED_PEOPLE.filter((person) => !blocked.has(person.displayName));
  const available = pool.length > 0 ? [...pool] : [...FEED_PEOPLE];
  const picked: FeedPersonSeed[] = [];

  while (picked.length < count && available.length > 0) {
    const index = Math.min(available.length - 1, Math.floor(random() * available.length));
    const [person] = available.splice(index, 1);
    if (person) picked.push(person);
  }

  return picked;
}
