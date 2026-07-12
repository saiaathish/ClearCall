"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FileImage, Gauge, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { MediaKind, OfficiatingCase } from "@/lib/types";

function getMediaKind(scenario: OfficiatingCase): MediaKind {
  if (scenario.mediaKind) return scenario.mediaKind;
  if (scenario.videoSrc) return "video";
  if (scenario.imageSrc || scenario.posterSrc) return "image";
  return "text";
}

export function CaseVideo({
  scenario,
  compact = false,
  priority = false,
}: {
  scenario: OfficiatingCase;
  compact?: boolean;
  priority?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const mediaKind = getMediaKind(scenario);
  const imageSrc = scenario.imageSrc ?? scenario.posterSrc;
  const width = scenario.mediaWidth ?? 1600;
  const height = scenario.mediaHeight ?? 900;
  const hasVideo = mediaKind === "video" && Boolean(scenario.videoSrc);
  const mediaStyle = { "--media-ratio": `${width} / ${height}` } as CSSProperties;

  // Compact feed clips autoplay muted only while on-screen.
  useEffect(() => {
    if (!compact || !hasVideo) return;
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    video.muted = true;

    const tryPlay = () => {
      void video.play().catch(() => {
        /* Autoplay can be blocked; poster still shows. */
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.2);
        if (visible) tryPlay();
        else video.pause();
      },
      { threshold: [0, 0.2, 0.5, 0.75], rootMargin: "120px 0px" },
    );
    observer.observe(video);
    video.addEventListener("loadeddata", tryPlay);
    tryPlay();
    return () => {
      observer.disconnect();
      video.removeEventListener("loadeddata", tryPlay);
      video.pause();
    };
  }, [compact, hasVideo, scenario.videoSrc]);

  if (mediaKind === "text") return null;

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  };

  const toggleRate = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextRate = rate === 1 ? 0.5 : 1;
    video.playbackRate = nextRate;
    setRate(nextRate);
  };

  return (
    <figure
      className={`case-media case-media--${mediaKind}${compact ? " case-media--compact" : ""}`}
      style={mediaStyle}
    >
      {mediaKind === "image" && imageSrc ? (
        <Image
          alt={scenario.mediaAlt}
          className="case-media__image"
          height={height}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          sizes={compact ? "(max-width: 880px) 100vw, 54vw" : "(max-width: 900px) 100vw, 48vw"}
          src={imageSrc}
          width={width}
        />
      ) : hasVideo ? (
        <video
          ref={videoRef}
          src={scenario.videoSrc ?? undefined}
          poster={scenario.posterSrc ?? undefined}
          controls={!compact}
          muted={muted}
          playsInline
          loop={compact}
          autoPlay={compact}
          preload={compact ? "auto" : "metadata"}
          aria-label={scenario.mediaAlt}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
          }}
        >
          <track kind="captions" label="Captions unavailable in demonstration" />
        </video>
      ) : (
        <>
          <div className="case-media__field" aria-hidden="true" />
          <div className="case-media__signal" aria-hidden="true" />
          <div className="case-media__placeholder">
            <span className="case-media__placeholder-icon" aria-hidden="true">
              {mediaKind === "image" ? <FileImage size={21} /> : <Play size={21} fill="currentColor" />}
            </span>
            <strong>{mediaKind === "image" ? "Image unavailable" : "Authorized demo clip placeholder"}</strong>
            <span>{scenario.mediaAlt}</span>
          </div>
        </>
      )}

      <div className="case-media__topline">
        <span className="meta-chip">{scenario.sport}</span>
        <span className="meta-chip">{scenario.category}</span>
      </div>

      {mediaKind === "video" && !compact && (
        <div className="case-media__controls" aria-label="Clip controls">
          <button
            className="media-control"
            type="button"
            onClick={toggleMute}
            disabled={!hasVideo}
            aria-label={muted ? "Unmute clip" : "Mute clip"}
            title={!hasVideo ? "Available when an authorized demo clip is added" : undefined}
          >
            {muted ? <VolumeX aria-hidden="true" size={15} /> : <Volume2 aria-hidden="true" size={15} />}
          </button>
          <button
            className="media-control"
            type="button"
            onClick={replay}
            disabled={!hasVideo}
            title={!hasVideo ? "Available when an authorized demo clip is added" : undefined}
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>Replay</span>
          </button>
          <div className="media-progress" aria-label={`Clip progress ${Math.round(progress)} percent`}>
            <span style={{ width: `${hasVideo ? progress : 28}%` }} />
          </div>
          <button
            className="media-control"
            type="button"
            onClick={toggleRate}
            disabled={!hasVideo}
            aria-label={`Set clip playback to ${rate === 1 ? "half speed" : "normal speed"}`}
            title={!hasVideo ? "Available when an authorized demo clip is added" : undefined}
          >
            <Gauge size={15} aria-hidden="true" />
            <span>{rate === 1 ? "0.5×" : "1×"}</span>
          </button>
        </div>
      )}
      <figcaption className="sr-only">{scenario.mediaAlt}</figcaption>
    </figure>
  );
}
