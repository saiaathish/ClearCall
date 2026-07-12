import Link from "next/link";
import { ArrowLeft, BadgeCheck, MapPin, MessageCircle, ThumbsUp } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { PersonProfile } from "@/data/profiles";

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export function PersonProfileView({ profile }: { profile: PersonProfile }) {
  const { publisher } = profile;

  return (
    <div className="page-shell">
      <Link className="text-link person-profile__back" href="/">
        <ArrowLeft aria-hidden="true" size={14} /> Back to feed
      </Link>

      <header className="profile-banner person-profile-banner">
        <Avatar
          className="person-profile-banner__avatar"
          initials={publisher.avatarInitials}
          size="lg"
          src={publisher.avatarSrc}
        />
        <div>
          <h1>
            {publisher.displayName}
            {publisher.isVerified && (
              <BadgeCheck className="verified-icon" aria-label="Verified" size={20} />
            )}
          </h1>
          <p>
            {roleLabel(publisher.role)}
            {publisher.organization ? ` · ${publisher.organization}` : ""}
          </p>
          <p className="person-profile__location">
            <MapPin aria-hidden="true" size={13} />
            {profile.location} · {profile.joinedLabel}
          </p>
        </div>
        <div className="profile-summary">
          <span className="profile-summary__item">
            <strong>{profile.casesPublished.length}</strong>
            <span>Published</span>
          </span>
          <span className="profile-summary__item">
            <strong>{profile.comments.length}</strong>
            <span>Comments</span>
          </span>
          <span className="profile-summary__item">
            <strong>{profile.helpfulReceived}</strong>
            <span>Helpful votes</span>
          </span>
        </div>
      </header>

      <section className="content-section person-profile__bio" aria-labelledby="person-bio-heading">
        <div className="content-section__header">
          <h2 className="section-title" id="person-bio-heading">About</h2>
        </div>
        <p>{profile.bio}</p>
        {profile.specialties.length > 0 && (
          <div className="person-profile__tags" aria-label="Specialties">
            {profile.specialties.map((item) => (
              <span className="meta-chip" key={item}>{item}</span>
            ))}
          </div>
        )}
        <p className="person-profile__disclaimer">{publisher.disclosure}</p>
      </section>

      <div className="profile-grid">
        <div className="profile-column">
          <section className="content-section" aria-labelledby="person-cases-heading">
            <div className="content-section__header">
              <h2 className="section-title" id="person-cases-heading">Cases published</h2>
            </div>
            {profile.casesPublished.length === 0 ? (
              <p className="person-profile__empty">No published cases yet — mostly jumping into discussions.</p>
            ) : (
              <ul className="person-profile__list">
                {profile.casesPublished.map((scenario) => (
                  <li key={scenario.id}>
                    <Link href={`/case/${scenario.id}`}>
                      <strong>{scenario.title}</strong>
                      <span>{scenario.category} · {scenario.difficulty}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="profile-column">
          <section className="content-section" aria-labelledby="person-comments-heading">
            <div className="content-section__header">
              <h2 className="section-title" id="person-comments-heading">
                <MessageCircle aria-hidden="true" size={16} /> Recent comments
              </h2>
            </div>
            {profile.comments.length === 0 ? (
              <p className="person-profile__empty">No comments in the demo catalog yet.</p>
            ) : (
              <ul className="person-profile__comments">
                {profile.comments.slice(0, 8).map((comment) => (
                  <li key={comment.id}>
                    <Link href={`/case/${comment.caseId}`}>
                      <span className="person-profile__comment-case">{comment.caseTitle}</span>
                      <p>{comment.body}</p>
                      <span className="person-profile__comment-meta">
                        <ThumbsUp aria-hidden="true" size={12} /> {comment.helpfulCount} helpful · {comment.postedAtLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="metric-grid person-profile__stats" aria-label="Practice snapshot">
            <div className="metric-card">
              <span className="metric-card__label">Practice estimate</span>
              <strong className="metric-card__value">{profile.casesCompletedEstimate}</strong>
              <span className="metric-card__detail">Cases worked in demo</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Alignment estimate</span>
              <strong className="metric-card__value">
                {profile.alignmentEstimate === null ? "—" : `${profile.alignmentEstimate}%`}
              </strong>
              <span className="metric-card__detail">Vs demo recommendations</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
