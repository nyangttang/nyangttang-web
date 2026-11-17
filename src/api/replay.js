import { request } from "./client.js";

const getReplayPage = (sessionId, afterSeq, limit, signal) =>
  request(
    `/api/v1/study/sessions/${sessionId}/replay?limit=${limit}` +
      (afterSeq != null ? `&afterSeq=${afterSeq}` : ""),
    { signal },
  );

// hasMore가 false가 될 때까지 이어받아 frames를 모두 모은다.
// 첫 페이지의 나머지 필드(startSnapshot, myMemberId, summary 등)는 그대로 유지.
export async function loadAllReplay(sessionId, signal) {
  let head = null;
  let afterSeq = null;
  const frames = [];
  for (;;) {
    const page = await getReplayPage(sessionId, afterSeq, 200, signal);
    head ??= page;
    frames.push(...page.frames);
    if (!page.hasMore || page.nextAfterSeq == null) break;
    afterSeq = page.nextAfterSeq;
  }
  return { ...head, frames };
}
