import { cases } from "@/data/cases";
import {
  FEED_PEOPLE,
  findPersonBySlug,
  personSlug,
  personToPublisher,
  seededRandom,
  type FeedPersonSeed,
  type PersonNat,
} from "@/data/feed-people";
import type { CaseCategory, DiscussionResponse, OfficiatingCase, Publisher, UserRole } from "@/lib/types";

export interface PersonProfile {
  id: string;
  publisher: Publisher;
  bio: string;
  location: string;
  joinedLabel: string;
  specialties: readonly CaseCategory[];
  casesPublished: readonly OfficiatingCase[];
  comments: readonly (DiscussionResponse & { caseTitle: string })[];
  helpfulReceived: number;
  casesCompletedEstimate: number;
  alignmentEstimate: number | null;
}

const LOCATION_BY_NAT: Record<PersonNat, readonly string[]> = {
  us: ["Austin, TX", "Chicago, IL", "Seattle, WA", "Columbus, OH", "Denver, CO"],
  gb: ["Manchester", "London", "Leeds", "Birmingham", "Glasgow"],
  es: ["Madrid", "Barcelona", "Valencia", "Seville"],
  br: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre"],
  fr: ["Lyon", "Paris", "Marseille", "Lille"],
  de: ["Munich", "Berlin", "Hamburg", "Cologne"],
  nl: ["Amsterdam", "Rotterdam", "Utrecht"],
  tr: ["Istanbul", "Ankara", "Izmir"],
  au: ["Sydney", "Melbourne", "Brisbane"],
  ca: ["Toronto", "Vancouver", "Montreal"],
  in: ["Mumbai", "Bengaluru", "Delhi", "Chennai"],
  mx: ["Mexico City", "Guadalajara", "Monterrey"],
  fi: ["Helsinki", "Tampere", "Turku"],
  no: ["Oslo", "Bergen", "Trondheim"],
  ir: ["Tehran", "Isfahan", "Shiraz"],
};

const BIO_BY_ROLE: Record<UserRole, readonly string[]> = {
  learner: [
    "Weekend clips so I stop freezing when the big one hits.",
    "Still learning. Fine being wrong in the thread if next Saturday goes better.",
    "Grassroots games plus this app. Trying to name the factor before I grab a card.",
    "Joined after a messy U15. Replaying the ones that still itch.",
  ],
  referee: [
    "Center most Saturdays. I note what I sold and what I'd change.",
    "Match day first. Comments second. I only care about calls you can actually sell.",
    "Long enough on the pitch to know the crowd isn't evidence.",
    "Short notes. If I can't say it clean, I don't sell it.",
  ],
  verified_referee: [
    "Panel ref. Here to pressure-test the close ones with other centers.",
    "Verified for the demo. Still just another ref arguing factors.",
    "Assessor days and league games. I like when two good answers fight.",
    "If the picture's fuzzy I say so. Fake certainty helps nobody.",
  ],
  educator: [
    "Clinic instructor. I pin reads that make people weigh factors, not vibes.",
    "I get newer refs to separate the restart from the card colour.",
    "Demo desk. Teaching clips, not official guidance.",
    "Paired contrasts are my thing. Same category, different weight on the hard factor.",
  ],
};

const CATEGORIES: readonly CaseCategory[] = [
  "Serious foul play",
  "Handball",
  "Offside interference",
  "Denial of an obvious goal-scoring opportunity",
  "Advantage",
  "Simulation",
  "Goalkeeper handling",
];

const JOINED_LABELS = [
  "Joined Jan 2025",
  "Joined Mar 2025",
  "Joined May 2025",
  "Joined Aug 2025",
  "Joined Oct 2025",
  "Joined Dec 2025",
  "Joined Feb 2026",
  "Joined Apr 2026",
] as const;

function pickFrom<T>(list: readonly T[], random: () => number): T {
  return list[Math.floor(random() * list.length)]!;
}

function specialtiesFor(person: FeedPersonSeed, random: () => number): CaseCategory[] {
  const count = 1 + Math.floor(random() * 3);
  const pool = [...CATEGORIES];
  const picked: CaseCategory[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    const [next] = pool.splice(index, 1);
    if (next) picked.push(next);
  }
  return picked;
}

function buildProfile(person: FeedPersonSeed): PersonProfile {
  const id = personSlug(person.displayName);
  const random = seededRandom(`profile:${id}`);
  const publisher = personToPublisher(person);
  const casesPublished = cases.filter((item) => item.publisher.id === id);
  const comments = cases.flatMap((item) =>
    item.seededDiscussion
      .filter((response) => response.author.id === id)
      .map((response) => ({ ...response, caseTitle: item.title })),
  );
  const helpfulReceived = comments.reduce((sum, item) => sum + item.helpfulCount, 0);
  const casesCompletedEstimate = 4 + Math.floor(random() * 48);
  const alignmentEstimate =
    person.role === "learner" ? 42 + Math.floor(random() * 48) : 55 + Math.floor(random() * 40);

  return {
    id,
    publisher,
    bio: pickFrom(BIO_BY_ROLE[person.role], random),
    location: pickFrom(LOCATION_BY_NAT[person.nationality], random),
    joinedLabel: pickFrom(JOINED_LABELS, random),
    specialties: specialtiesFor(person, random),
    casesPublished,
    comments,
    helpfulReceived,
    casesCompletedEstimate,
    alignmentEstimate,
  };
}

const PROFILE_BY_ID: ReadonlyMap<string, PersonProfile> = new Map(
  FEED_PEOPLE.map((person) => {
    const profile = buildProfile(person);
    return [profile.id, profile] as const;
  }),
);

export const PERSON_PROFILES: readonly PersonProfile[] = [...PROFILE_BY_ID.values()];

export function getPersonProfile(id: string): PersonProfile | undefined {
  const direct = PROFILE_BY_ID.get(id);
  if (direct) return direct;
  const person = findPersonBySlug(id);
  return person ? buildProfile(person) : undefined;
}

export function personProfileHref(publisher: Pick<Publisher, "id">): string {
  return `/people/${publisher.id}`;
}

export function allPersonProfileIds(): string[] {
  return PERSON_PROFILES.map((profile) => profile.id);
}
