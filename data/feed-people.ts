import type { Publisher, UserRole } from "@/lib/types";

export interface FeedPersonSeed {
  displayName: string;
  role: UserRole;
  organization?: string;
  isVerified?: boolean;
  /** Index into /media/avatars/avatar-XX.svg */
  avatarIndex: number;
}

const FIRST_NAMES = [
  "Maya", "Omar", "Priya", "Jonas", "Aisha", "Leo", "Harper", "Diego", "Sofia", "Kenji",
  "Amelia", "Noah", "Elena", "Caleb", "Fatima", "Marcus", "Ines", "Theo", "Yuki", "Grace",
  "Rohan", "Chloe", "Andre", "Nora", "Jamal", "Lucia", "Ethan", "Zara", "Felix", "Camila",
  "Benji", "Ananya", "Owen", "Mei", "Santiago", "Hannah", "Idris", "Claire", "Mateo", "Riley",
  "Nadia", "Hugo", "Amara", "Sean", "Valentina", "Kai", "Isabelle", "Tariq", "Emma", "Luis",
  "Ava", "Miles", "Layla", "Brett", "Sienna", "Devon", "Nina", "Callum", "Imani", "Victor",
  "Freya", "Hassan", "Jun", "Paula", "Ravi", "Greta", "Malik", "Iris", "Tobias", "Noor",
  "Adrian", "Selena", "Kofi", "Helena", "Bruno", "Yara", "Patrick", "Mina", "Oscar", "Leila",
  "Daniel", "Aiko", "Gabriel", "Ruth", "Ibrahim", "Celine", "Nathan", "Dalia", "Quinn", "Soren",
  "Bianca", "Ashwin", "Tara", "Erik", "Monique", "Jasper", "Hana", "Reuben", "Ophelia", "Cruz",
] as const;

const LAST_NAMES = [
  "Chen", "Haddad", "Nair", "Berg", "Okonkwo", "Martins", "Quinn", "Alvarez", "Rossi", "Watanabe",
  "Brooks", "Ibrahim", "Popov", "Nguyen", "Al-Rashid", "Doyle", "Duarte", "Lambert", "Tanaka", "Mwangi",
  "Kapoor", "Sanders", "Silva", "Lindqvist", "Wright", "Fernandez", "Park", "Khan", "Hartmann", "Soto",
  "Cole", "Shah", "McCarthy", "Ling", "Ruiz", "Vogel", "Bello", "Dubois", "Costa", "Fox",
  "Petrova", "Jensen", "Diallo", "ONeill", "Ricci", "Nakamura", "Moreau", "Hassan", "Johansson", "Ortega",
  "Kim", "Carter", "Walsh", "Price", "Okada", "Brennan", "Adeyemi", "Novak", "Cho", "Sullivan",
  "Patel", "Rivera", "Lee", "Garcia", "Mbeki", "Andersen", "Torres", "Singh", "Kowalski", "Bailey",
  "Hoffman", "Morales", "Abbas", "Fischer", "Yamamoto", "Collins", "Reyes", "Bergstrom", "Diaz", "Okafor",
] as const;

const ROLES: readonly UserRole[] = ["learner", "referee", "verified_referee", "educator"];
const ORGS = [
  "Metro Youth League",
  "Referee academy desk",
  "County assessor panel",
  "State association",
  "Clinic instructor pool",
  "High school assignors",
  "Regional panel",
  "Laws clinic",
  "Grassroots mentor desk",
  "U19 development",
  "Adult recreational",
  "College club circuit",
  "Instructor network",
  "Youth development",
  "Assessor corps",
  undefined,
  undefined,
  undefined,
] as const;

function buildPeoplePool(): FeedPersonSeed[] {
  const people: FeedPersonSeed[] = [];
  const seen = new Set<string>();

  // Keep a few familiar demo anchors first.
  const anchors: FeedPersonSeed[] = [
    { displayName: "ClearCall demo desk", role: "educator", organization: "Authored product prototype", avatarIndex: 50 },
    { displayName: "Sam Rivera", role: "referee", avatarIndex: 51 },
    { displayName: "Nia Patel", role: "learner", avatarIndex: 52 },
    { displayName: "Jordan Lee", role: "learner", avatarIndex: 53 },
  ];
  for (const person of anchors) {
    seen.add(person.displayName);
    people.push(person);
  }

  let avatarIndex = 0;
  for (let firstIndex = 0; firstIndex < FIRST_NAMES.length; firstIndex += 1) {
    for (let lastOffset = 0; lastOffset < LAST_NAMES.length; lastOffset += 1) {
      if (people.length >= 220) return people;
      const lastIndex = (firstIndex * 3 + lastOffset * 7) % LAST_NAMES.length;
      const displayName = `${FIRST_NAMES[firstIndex]} ${LAST_NAMES[lastIndex]}`;
      if (seen.has(displayName)) continue;
      seen.add(displayName);
      const role = ROLES[(firstIndex + lastIndex) % ROLES.length]!;
      const organization = ORGS[(firstIndex * 5 + lastIndex) % ORGS.length];
      people.push({
        displayName,
        role,
        organization,
        isVerified: role === "verified_referee" || role === "educator",
        avatarIndex: avatarIndex % 80,
      });
      avatarIndex += 1;
    }
  }

  return people;
}

/** Diverse fictional demo names — picked by seeded RNG, not hardcoded repeats. */
export const FEED_PEOPLE: readonly FeedPersonSeed[] = buildPeoplePool();

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
