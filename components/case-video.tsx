"use client";

import { useRef, useState } from "react";
import { Gauge, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { OfficiatingCase } from "@/lib/types";

export function CaseVideo({ scenario }: { scenario: OfficiatingCase }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const hasVideo = Boolean(scenario.videoSrc);

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
    <div className="case-media">
      {hasVideo ? (
        <video
          ref={videoRef}
          src={scenario.videoSrc ?? undefined}
          poster={scenario.posterSrc ?? undefined}
          controls
          muted={muted}
          playsInline
          preload="metadata"
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
              <Play size={21} fill="currentColor" />
            </span>
            <strong>Authorized demo clip placeholder</strong>
            <span>{scenario.mediaAlt}</span>
          </div>
        </>
      )}
      <div className="case-media__topline">
        <span className="meta-chip">{scenario.sport}</span>
        <span className="meta-chip">{scenario.category}</span>
      </div>
      <div className="case-media__controls" aria-label="Clip controls">
        <button
          className="media-control"
          type="button"
          onClick={toggleMute}
          disabled={!hasVideo}
          aria-label={muted ? "Unmute clip" : "Mute clip"}
          title={!hasVideo ? "Available when an authorized demo clip is added" : undefined}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
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
    </div>
  );
}
