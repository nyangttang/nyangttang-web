import { useEffect, useMemo, useState } from "react";
import MapGrid from "../pages/MapGrid";
import { loadAllReplay } from "../api/replay";
import { errorMessage } from "../api/client";
import "./TimelapsePlayer.css";

const SPEEDS = [1, 2, 4, 8];

export default function TimelapsePlayer({ sessionId, onClose }) {
  const [replay, setReplay] = useState(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);

  useEffect(() => {
    const controller = new AbortController();
    setReplay(null);
    setError("");
    setIndex(0);
    setPlaying(false);
    loadAllReplay(sessionId, controller.signal)
      .then((r) => {
        setReplay(r);
        setPlaying(true);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      });
    return () => controller.abort();
  }, [sessionId]);

  // 0번 = 세션 시작 스냅샷, 이후 = 이벤트마다 저장된 전체 스냅샷
  const steps = useMemo(() => {
    if (!replay) return [];
    return [
      { snapshot: replay.startSnapshot, at: replay.startedAt },
      ...replay.frames.map((f) => ({ snapshot: f.snapshot, at: f.occurredAt })),
    ];
  }, [replay]);

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 600 / speed);
    return () => clearInterval(timer);
  }, [playing, speed, steps.length]);

  if (error) {
    return (
      <div className="tl-box">
        <p role="alert">{error}</p>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    );
  }
  if (!replay) {
    return (
      <div className="tl-box">
        <p>타임랩스를 불러오고 있어요…</p>
      </div>
    );
  }

  const step = steps[index];
  const atEnd = index >= steps.length - 1;
  const time = step.at
    ? new Date(step.at).toLocaleTimeString("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";
  const s = replay.summary;

  return (
    <div className="tl-box">
      <MapGrid
        snapshot={{ ...step.snapshot, myMemberId: replay.myMemberId }}
        showMarkers
        currentTab="timelapse"
      />
      <input
        className="tl-slider"
        type="range"
        min={0}
        max={steps.length - 1}
        value={index}
        onChange={(e) => {
          setPlaying(false);
          setIndex(Number(e.target.value));
        }}
      />
      <p className="tl-time">
        {time} · {index + 1}/{steps.length}
      </p>
      <div className="tl-controls">
        <button
          type="button"
          onClick={() => {
            if (atEnd) setIndex(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? "일시정지" : atEnd ? "다시 보기" : "재생"}
        </button>
        {SPEEDS.map((v) => (
          <button
            key={v}
            type="button"
            className={v === speed ? "on" : ""}
            onClick={() => setSpeed(v)}
          >
            {v}x
          </button>
        ))}
        <button type="button" onClick={onClose}>
          실시간으로 돌아가기
        </button>
      </div>
      {atEnd && s && (
        <p className="tl-summary">
          이번 세션: 땅 +{s.gainedCount} / -{s.lostCount} (보유{" "}
          {s.startOwnedCellCount} → {s.endOwnedCellCount}칸)
        </p>
      )}
    </div>
  );
}
