import type { Publisher, UserRole } from "@/lib/types";
import portraitManifest from "@/public/media/avatars/portraits/manifest.json";

export type PersonGender = "women" | "men";
export type PersonNat =
  | "us"
  | "gb"
  | "es"
  | "br"
  | "fr"
  | "de"
  | "nl"
  | "tr"
  | "au"
  | "ca"
  | "in"
  | "mx"
  | "fi"
  | "no"
  | "ir";

export interface FeedPersonSeed {
  displayName: string;
  role: UserRole;
  organization?: string;
  isVerified?: boolean;
  gender: PersonGender;
  nationality: PersonNat;
  /** Stable pick into the nationality+gender portrait pool. */
  portraitIndex: number;
}

type PortraitManifest = Record<string, readonly string[]>;
const PORTRAITS = portraitManifest as PortraitManifest;

type NameCard = {
  first: string;
  last: string;
  gender: PersonGender;
  nationality: PersonNat;
};

/** Curated name cards so gender + nationality map to real portrait buckets. */
const NAME_CARDS: readonly NameCard[] = [
  // US
  { first: "Harper", last: "Brooks", gender: "women", nationality: "us" },
  { first: "Miles", last: "Carter", gender: "men", nationality: "us" },
  { first: "Ava", last: "Sullivan", gender: "women", nationality: "us" },
  { first: "Brett", last: "Price", gender: "men", nationality: "us" },
  { first: "Grace", last: "Walsh", gender: "women", nationality: "us" },
  { first: "Ethan", last: "Bailey", gender: "men", nationality: "us" },
  { first: "Chloe", last: "Fox", gender: "women", nationality: "us" },
  { first: "Noah", last: "Collins", gender: "men", nationality: "us" },
  { first: "Riley", last: "Sanders", gender: "women", nationality: "us" },
  { first: "Devon", last: "Wright", gender: "men", nationality: "us" },
  { first: "Emma", last: "Doyle", gender: "women", nationality: "us" },
  { first: "Owen", last: "Cole", gender: "men", nationality: "us" },
  // GB
  { first: "Amelia", last: "Quinn", gender: "women", nationality: "gb" },
  { first: "Callum", last: "ONeill", gender: "men", nationality: "gb" },
  { first: "Freya", last: "Hartmann", gender: "women", nationality: "gb" },
  { first: "Oliver", last: "Brennan", gender: "men", nationality: "gb" },
  { first: "Isla", last: "McCarthy", gender: "women", nationality: "gb" },
  { first: "Sean", last: "Doyle", gender: "men", nationality: "gb" },
  { first: "Poppy", last: "Lambert", gender: "women", nationality: "gb" },
  { first: "Harry", last: "Price", gender: "men", nationality: "gb" },
  // ES
  { first: "Sofia", last: "Alvarez", gender: "women", nationality: "es" },
  { first: "Diego", last: "Ruiz", gender: "men", nationality: "es" },
  { first: "Lucia", last: "Fernandez", gender: "women", nationality: "es" },
  { first: "Mateo", last: "Garcia", gender: "men", nationality: "es" },
  { first: "Valentina", last: "Morales", gender: "women", nationality: "es" },
  { first: "Hugo", last: "Ortega", gender: "men", nationality: "es" },
  { first: "Elena", last: "Reyes", gender: "women", nationality: "es" },
  { first: "Pablo", last: "Diaz", gender: "men", nationality: "es" },
  // BR
  { first: "Camila", last: "Silva", gender: "women", nationality: "br" },
  { first: "Andre", last: "Costa", gender: "men", nationality: "br" },
  { first: "Isabela", last: "Santos", gender: "women", nationality: "br" },
  { first: "Lucas", last: "Oliveira", gender: "men", nationality: "br" },
  { first: "Beatriz", last: "Souza", gender: "women", nationality: "br" },
  { first: "Rafael", last: "Martins", gender: "men", nationality: "br" },
  { first: "Larissa", last: "Ferreira", gender: "women", nationality: "br" },
  { first: "Thiago", last: "Almeida", gender: "men", nationality: "br" },
  // FR
  { first: "Claire", last: "Dubois", gender: "women", nationality: "fr" },
  { first: "Theo", last: "Moreau", gender: "men", nationality: "fr" },
  { first: "Ines", last: "Laurent", gender: "women", nationality: "fr" },
  { first: "Louis", last: "Bernard", gender: "men", nationality: "fr" },
  { first: "Camille", last: "Petit", gender: "women", nationality: "fr" },
  { first: "Hugo", last: "Robert", gender: "men", nationality: "fr" },
  // DE
  { first: "Greta", last: "Hoffman", gender: "women", nationality: "de" },
  { first: "Felix", last: "Fischer", gender: "men", nationality: "de" },
  { first: "Helena", last: "Vogel", gender: "women", nationality: "de" },
  { first: "Jonas", last: "Hartmann", gender: "men", nationality: "de" },
  { first: "Nina", last: "Weber", gender: "women", nationality: "de" },
  { first: "Tobias", last: "Schneider", gender: "men", nationality: "de" },
  // NL
  { first: "Iris", last: "Jansen", gender: "women", nationality: "nl" },
  { first: "Daan", last: "de Vries", gender: "men", nationality: "nl" },
  { first: "Lotte", last: "Bakker", gender: "women", nationality: "nl" },
  { first: "Sven", last: "Visser", gender: "men", nationality: "nl" },
  // TR
  { first: "Elif", last: "Yilmaz", gender: "women", nationality: "tr" },
  { first: "Emre", last: "Demir", gender: "men", nationality: "tr" },
  { first: "Zeynep", last: "Kaya", gender: "women", nationality: "tr" },
  { first: "Can", last: "Celik", gender: "men", nationality: "tr" },
  // AU
  { first: "Sienna", last: "Taylor", gender: "women", nationality: "au" },
  { first: "Liam", last: "Wilson", gender: "men", nationality: "au" },
  { first: "Olivia", last: "Harris", gender: "women", nationality: "au" },
  { first: "Jack", last: "Thompson", gender: "men", nationality: "au" },
  // CA
  { first: "Hannah", last: "MacLeod", gender: "women", nationality: "ca" },
  { first: "Nathan", last: "Roy", gender: "men", nationality: "ca" },
  { first: "Emily", last: "Tremblay", gender: "women", nationality: "ca" },
  { first: "Owen", last: "Gagnon", gender: "men", nationality: "ca" },
  // IN
  { first: "Priya", last: "Nair", gender: "women", nationality: "in" },
  { first: "Rohan", last: "Kapoor", gender: "men", nationality: "in" },
  { first: "Ananya", last: "Shah", gender: "women", nationality: "in" },
  { first: "Arjun", last: "Patel", gender: "men", nationality: "in" },
  { first: "Meera", last: "Iyer", gender: "women", nationality: "in" },
  { first: "Vikram", last: "Singh", gender: "men", nationality: "in" },
  { first: "Neha", last: "Reddy", gender: "women", nationality: "in" },
  { first: "Kabir", last: "Mehta", gender: "men", nationality: "in" },
  // MX
  { first: "Valeria", last: "Hernandez", gender: "women", nationality: "mx" },
  { first: "Luis", last: "Ramirez", gender: "men", nationality: "mx" },
  { first: "Mariana", last: "Torres", gender: "women", nationality: "mx" },
  { first: "Carlos", last: "Lopez", gender: "men", nationality: "mx" },
  { first: "Daniela", last: "Gonzalez", gender: "women", nationality: "mx" },
  { first: "Miguel", last: "Rivera", gender: "men", nationality: "mx" },
  // FI
  { first: "Aino", last: "Virtanen", gender: "women", nationality: "fi" },
  { first: "Elias", last: "Korhonen", gender: "men", nationality: "fi" },
  { first: "Emilia", last: "Nieminen", gender: "women", nationality: "fi" },
  { first: "Onni", last: "Makinen", gender: "men", nationality: "fi" },
  // NO
  { first: "Ingrid", last: "Hansen", gender: "women", nationality: "no" },
  { first: "Lars", last: "Johansen", gender: "men", nationality: "no" },
  { first: "Nora", last: "Olsen", gender: "women", nationality: "no" },
  { first: "Erik", last: "Andersen", gender: "men", nationality: "no" },
  // IR
  { first: "Sara", last: "Hosseini", gender: "women", nationality: "ir" },
  { first: "Reza", last: "Mohammadi", gender: "men", nationality: "ir" },
  { first: "Leila", last: "Ahmadi", gender: "women", nationality: "ir" },
  { first: "Amir", last: "Karimi", gender: "men", nationality: "ir" },
  // Extra US / GB depth for pool size
  { first: "Maya", last: "Johnson", gender: "women", nationality: "us" },
  { first: "Marcus", last: "Williams", gender: "men", nationality: "us" },
  { first: "Jordan", last: "Lee", gender: "men", nationality: "us" },
  { first: "Sam", last: "Rivera", gender: "men", nationality: "us" },
  { first: "Nia", last: "Patel", gender: "women", nationality: "us" },
  { first: "Aisha", last: "Coleman", gender: "women", nationality: "us" },
  { first: "Jamal", last: "Brooks", gender: "men", nationality: "us" },
  { first: "Imani", last: "Grant", gender: "women", nationality: "us" },
  { first: "Ruth", last: "Parker", gender: "women", nationality: "gb" },
  { first: "Patrick", last: "Murphy", gender: "men", nationality: "gb" },
  { first: "Isabelle", last: "Clarke", gender: "women", nationality: "gb" },
  { first: "Daniel", last: "Hughes", gender: "men", nationality: "gb" },
  { first: "Fatima", last: "Khan", gender: "women", nationality: "gb" },
  { first: "Omar", last: "Hassan", gender: "men", nationality: "gb" },
  { first: "Yara", last: "Abbas", gender: "women", nationality: "gb" },
  { first: "Idris", last: "Ali", gender: "men", nationality: "gb" },
  { first: "Bianca", last: "Rossi", gender: "women", nationality: "es" },
  { first: "Marco", last: "Ricci", gender: "men", nationality: "es" },
  { first: "Selena", last: "Costa", gender: "women", nationality: "br" },
  { first: "Bruno", last: "Nunes", gender: "men", nationality: "br" },
  { first: "Celine", last: "Martin", gender: "women", nationality: "fr" },
  { first: "Antoine", last: "Lefevre", gender: "men", nationality: "fr" },
  { first: "Paula", last: "Keller", gender: "women", nationality: "de" },
  { first: "Lukas", last: "Bauer", gender: "men", nationality: "de" },
  { first: "Mina", last: "van Dijk", gender: "women", nationality: "nl" },
  { first: "Jasper", last: "Smit", gender: "men", nationality: "nl" },
  { first: "Noor", last: "Yildiz", gender: "women", nationality: "tr" },
  { first: "Baran", last: "Aydin", gender: "men", nationality: "tr" },
  { first: "Tara", last: "Mitchell", gender: "women", nationality: "au" },
  { first: "Ethan", last: "Campbell", gender: "men", nationality: "au" },
  { first: "Amara", last: "Nguyen", gender: "women", nationality: "ca" },
  { first: "Victor", last: "Chen", gender: "men", nationality: "ca" },
  { first: "Aisha", last: "Banerjee", gender: "women", nationality: "in" },
  { first: "Dev", last: "Choudhury", gender: "men", nationality: "in" },
  { first: "Sofia", last: "Castillo", gender: "women", nationality: "mx" },
  { first: "Javier", last: "Mendoza", gender: "men", nationality: "mx" },
  { first: "Helmi", last: "Laine", gender: "women", nationality: "fi" },
  { first: "Mika", last: "Heikkinen", gender: "men", nationality: "fi" },
  { first: "Astrid", last: "Berg", gender: "women", nationality: "no" },
  { first: "Soren", last: "Nilsen", gender: "men", nationality: "no" },
  { first: "Dalia", last: "Rahimi", gender: "women", nationality: "ir" },
  { first: "Kian", last: "Nazari", gender: "men", nationality: "ir" },
  { first: "Quinn", last: "Foster", gender: "women", nationality: "us" },
  { first: "Adrian", last: "Hayes", gender: "men", nationality: "us" },
  { first: "Phoebe", last: "Bennett", gender: "women", nationality: "gb" },
  { first: "George", last: "Palmer", gender: "men", nationality: "gb" },
];

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

function portraitBucket(gender: PersonGender, nationality: PersonNat): string {
  return `${gender}-${nationality}`;
}

function avatarSrcForPerson(person: Pick<FeedPersonSeed, "gender" | "nationality" | "portraitIndex">): string {
  const key = portraitBucket(person.gender, person.nationality);
  const pool = PORTRAITS[key] ?? PORTRAITS[`men-us`] ?? [];
  if (pool.length === 0) return "/media/avatars/portraits/men-us-00.jpg";
  return pool[((person.portraitIndex % pool.length) + pool.length) % pool.length]!;
}

function buildPeoplePool(): FeedPersonSeed[] {
  const people: FeedPersonSeed[] = [];
  const seen = new Set<string>();
  const portraitCursor: Record<string, number> = {};

  const anchors: FeedPersonSeed[] = [
    {
      displayName: "ClearCall demo desk",
      role: "educator",
      organization: "Authored product prototype",
      gender: "men",
      nationality: "us",
      portraitIndex: 0,
    },
    {
      displayName: "Sam Rivera",
      role: "referee",
      gender: "men",
      nationality: "us",
      portraitIndex: 1,
    },
    {
      displayName: "Nia Patel",
      role: "learner",
      gender: "women",
      nationality: "us",
      portraitIndex: 2,
    },
    {
      displayName: "Jordan Lee",
      role: "learner",
      gender: "men",
      nationality: "us",
      portraitIndex: 3,
    },
  ];

  for (const person of anchors) {
    seen.add(person.displayName);
    people.push(person);
  }

  for (let index = 0; index < NAME_CARDS.length; index += 1) {
    if (people.length >= 220) break;
    const card = NAME_CARDS[index]!;
    const displayName = `${card.first} ${card.last}`;
    if (seen.has(displayName)) continue;
    seen.add(displayName);

    const bucket = portraitBucket(card.gender, card.nationality);
    const nextIndex = portraitCursor[bucket] ?? 0;
    portraitCursor[bucket] = nextIndex + 1;

    const role = ROLES[(index + card.first.length) % ROLES.length]!;
    const organization = ORGS[(index * 3 + card.last.length) % ORGS.length];

    people.push({
      displayName,
      role,
      organization,
      isVerified: role === "verified_referee" || role === "educator",
      gender: card.gender,
      nationality: card.nationality,
      portraitIndex: nextIndex,
    });
  }

  // Expand the pool with rotated surname pairings so discussions stay unique.
  for (let round = 0; people.length < 220 && round < 4; round += 1) {
    for (let index = 0; index < NAME_CARDS.length && people.length < 220; index += 1) {
      const firstCard = NAME_CARDS[index]!;
      const lastCard = NAME_CARDS[(index * 5 + round * 11 + 3) % NAME_CARDS.length]!;
      if (firstCard.nationality !== lastCard.nationality || firstCard.gender !== lastCard.gender) continue;
      const displayName = `${firstCard.first} ${lastCard.last}`;
      if (seen.has(displayName)) continue;
      seen.add(displayName);

      const bucket = portraitBucket(firstCard.gender, firstCard.nationality);
      const nextIndex = portraitCursor[bucket] ?? 0;
      portraitCursor[bucket] = nextIndex + 1;
      const role = ROLES[(index + round) % ROLES.length]!;
      const organization = ORGS[(index + round * 7) % ORGS.length];

      people.push({
        displayName,
        role,
        organization,
        isVerified: role === "verified_referee" || role === "educator",
        gender: firstCard.gender,
        nationality: firstCard.nationality,
        portraitIndex: nextIndex,
      });
    }
  }

  return people;
}

/** Diverse fictional demo names with gender/nationality-matched portraits. */
export const FEED_PEOPLE: readonly FeedPersonSeed[] = buildPeoplePool();

/** @deprecated Prefer avatarSrcForPerson via personToPublisher. Kept for call sites. */
export function avatarSrcForIndex(index: number): string {
  const person = FEED_PEOPLE[((index % FEED_PEOPLE.length) + FEED_PEOPLE.length) % FEED_PEOPLE.length]!;
  return avatarSrcForPerson(person);
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

/** Stable URL-safe id so the same person links to one profile across cases. */
export function personSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function personToPublisher(person: FeedPersonSeed): Publisher {
  return {
    id: personSlug(person.displayName),
    displayName: person.displayName,
    role: person.role,
    organization: person.organization,
    avatarInitials: initialsForName(person.displayName),
    avatarSrc: avatarSrcForPerson(person),
    isVerified: Boolean(person.isVerified),
    isSynthetic: true,
    disclosure:
      person.role === "educator" && person.displayName === "ClearCall demo desk"
        ? "Fictional demo publisher; no credential or affiliation is claimed."
        : "Fictional demo participant; no credential is claimed.",
  };
}

export function findPersonBySlug(slug: string): FeedPersonSeed | undefined {
  return FEED_PEOPLE.find((person) => personSlug(person.displayName) === slug);
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
