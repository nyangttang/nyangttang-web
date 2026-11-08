import { useState } from "react";
import MapGrid from "./MapGrid";
import "./RoomPage.css";

import grassNav from "../assets/grass-nav.png";
import deviceCat from "../assets/device-cat.png";
import blackCat from "../assets/black-cat.png";
import cheeseCat from "../assets/cheese-cat.png";
import grayCat from "../assets/gray-cat.png";
import threeCat from "../assets/three-cat.png";
import whiteCat from "../assets/white-cat.png";

const CAT_IMAGES = {
  "#ffffff": whiteCat,
  "#dedbd8": grayCat,
  "#ffe0ad": cheeseCat,
  "#d9b786": threeCat,
  "#8d8580": blackCat,
};

const MENUS = [
  { id: "walk", label: "산책" },
  { id: "friends", label: "친구" },
  { id: "records", label: "기록" },
  { id: "device", label: "기기" },
];

export default function RoomPage({ room, onBack }) {
  const [tab, setTab] = useState("walk");
  const [copyMessage, setCopyMessage] = useState("");
  const catImage = CAT_IMAGES[room.color] || whiteCat;
  
  const today = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const goalHours = Math.floor(room.goalMinutes / 60);
  const goalRemainder = room.goalMinutes % 60;
  const goalText = [
    goalHours > 0 ? `${goalHours}시간` : "",
    goalRemainder > 0 ? `${goalRemainder}분` : "",
  ]
    .filter(Boolean)
    .join(" ");

  async function copyRoomCode() {
    if (!room.roomCode) return;

    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopyMessage("방 코드를 복사했어요.");
    } catch {
      setCopyMessage("복사하지 못했어요. 코드를 길게 눌러 복사해 주세요.");
    }
  }

  return (
    <main className="room-page">
      <div className="room-topbar">
        <button type="button" onClick={onBack}>
          ← 처음으로
        </button>
      </div>

      <div className="room-content">
        {tab === "walk" && (
          <>
            <header className="room-heading">
              <h1>{room.roomName}</h1>
              <p>{today} · 공부 시간 확인 전</p>
            </header>

            <section className="room-my-cat" aria-label="내 고양이">
              <div className="room-avatar">
                <img src={catImage} alt="" />
              </div>

              <div className="room-my-cat-info">
                <div className="room-my-cat-title">
                  <strong>{room.name}</strong>
                  <span>—%</span>
                </div>

                <div className="room-goal-track" aria-hidden="true" />

                <p>오늘 시간 확인 전 · 목표 {goalText}</p>
              </div>
            </section>
          </>
        )}

        {tab === "friends" && (
          <>
            <header className="room-heading">
              <h1>우리 방 친구들</h1>
              <p>참여자 상태를 확인할 준비 중이에요</p>
            </header>

            <section className="room-friend-list" aria-label="참여자">
              <article className="room-friend">
                <div className="room-avatar">
                  <img src={catImage} alt="" />
                </div>

                <div className="room-friend-info">
                  <div className="room-friend-name">
                    <strong>{room.name}</strong>
                    <span className="room-status">참여 확인 전</span>
                  </div>
                  <p>오늘 시간 확인 전 · 땅 —%</p>
                </div>
              </article>
            </section>

            <p className="room-help">
              입력한 내 고양이 정보예요. 실제 친구 목록과 산책 상태는
              서버 연결 후 표시돼요.
            </p>

            <section className="room-invite" aria-label="방 코드">
              <div>
                <span className="room-small-label">방 코드</span>
                <strong>{room.roomCode || "발급 대기"}</strong>
              </div>

              <button
                type="button"
                onClick={copyRoomCode}
                disabled={!room.roomCode}
              >
                복사
              </button>
            </section>

            <p className="room-help" role="status">
              {copyMessage ||
                (room.roomCode
                  ? "입력한 코드이며, 아직 서버 확인 전이에요."
                  : "방을 실제로 생성하면 코드가 발급돼요.")}
            </p>
          </>
        )}

        {tab === "records" && (
          <header className="room-heading">
            <h1>오늘의 산책 지도</h1>
            <p>{today} · 저장 기록 확인 전</p>
          </header>
        )}

        {/* 탭을 바꿔도 기존 지도를 유지해 이동 상태가 초기화되지 않아요. */}
        <section
          className="room-map-section"
          hidden={tab !== "walk" && tab !== "records"}
          aria-label="예시 지도"
        >
          <div className="room-map-frame">
            <MapGrid />
          </div>
          <p className="room-help">
            예시 데이터로 움직이는 지도예요. 내 고양이·실제 기록과는
            아직 연결되지 않았어요.
          </p>
        </section>

        {tab === "records" && (
          <section className="room-record-card">
            <h2>오늘의 산책 기록</h2>

            <dl className="room-record-values">
              <div>
                <dt>공부 시간</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>목표 시간</dt>
                <dd>{goalText}</dd>
              </div>
              <div>
                <dt>내 땅</dt>
                <dd>—%</dd>
              </div>
            </dl>

            <p className="room-help">
              저장 기록을 연결하면 오늘의 순위와 고양이별 공부 시간을
              여기에 보여줄 거예요.
            </p>
          </section>
        )}

        {tab === "device" && (
          <>
            <header className="room-heading">
              <h1>식빵냥</h1>
              <p>내 식빵냥의 상태를 확인해요</p>
            </header>

            <section className="room-device-card">
              <div className="room-device-picture">
                <img src={deviceCat} alt="" />
              </div>

              <h2>{room.name}의 식빵냥</h2>
              <span className="room-status">연결 확인 전</span>

              <dl className="room-record-values">
                <div>
                  <dt>입력한 기기 코드</dt>
                  <dd>{room.deviceCode}</dd>
                </div>
                <div>
                  <dt>폰 감지</dt>
                  <dd>확인 전</dd>
                </div>
                <div>
                  <dt>착석 감지</dt>
                  <dd>확인 전</dd>
                </div>
              </dl>

              <p className="room-help">
                기기 연결 기능을 연결하면 실제 연결 상태와 센서 상태를
                확인할 수 있어요.
              </p>
            </section>
          </>
        )}
      </div>

      <nav className="room-bottom-nav" aria-label="주 메뉴">
        <img
          className="room-nav-grass"
          src={grassNav}
          alt=""
        />

        {MENUS.map((menu) => (
          <button
            key={menu.id}
            type="button"
            aria-current={tab === menu.id ? "page" : undefined}
            onClick={() => setTab(menu.id)}
          >
            {menu.label}
          </button>
        ))}
      </nav>
    </main>
  );
}