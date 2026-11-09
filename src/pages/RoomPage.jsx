import { useRoomSnapshot } from '../hooks/useRoomSnapshot';
import { getDevice, getRanking, getTodayStudy, registerDevice } from '../api/rooms';
import { formColor, stateText, studyTime, sensorText } from '../api/viewModels';
import { errorMessage } from '../api/client';
import DeviceKeyDialog from '../components/DeviceKeyDialog';
import { useEffect, useState } from "react";
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

export default function RoomPage({ room, onBack, onUnavailable, notice }) {
  const [tab, setTab] = useState("walk");
  const [copyMessage, setCopyMessage] = useState("");
  const { snapshot, error, reconnect } = useRoomSnapshot(room.roomId, onUnavailable);
  const me = snapshot?.members.find(member => String(member.memberId) === String(snapshot.myMemberId));
  const [device, setDevice] = useState(null);
  const [deviceLoaded, setDeviceLoaded] = useState(false);
  const [ranking, setRanking] = useState(null);
  const [daily, setDaily] = useState(null);
  const [queryError, setQueryError] = useState('');
  const [askKey, setAskKey] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); let busy = false;
    async function load() {
      if (busy) return; busy = true;
      try {
        const result = await getDevice(room.roomId, controller.signal);
        if (!controller.signal.aborted) { setDevice(result); setDeviceLoaded(true); }
        if (tab === 'records' && snapshot?.studyDate) {
          const [rank, study] = await Promise.all([getRanking(room.roomId, controller.signal), getTodayStudy(snapshot.studyDate, controller.signal)]);
          if (!controller.signal.aborted) { setRanking(rank); setDaily(study); }
        }
        if (!controller.signal.aborted) setQueryError('');
      } catch (e) { if (!controller.signal.aborted) setQueryError(errorMessage(e)); }
      finally { busy = false; }
    }
    load(); const timer = setInterval(load, 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [room.roomId, tab, snapshot?.studyDate]);
  async function connectDevice({code, key}) {
    setAskKey(false); setDeviceBusy(true);
    try { await registerDevice(room.roomId, code, key); setDevice(await getDevice(room.roomId)); setQueryError(''); }
    catch (e) { setQueryError(errorMessage(e)); }
    finally { setDeviceBusy(false); }
  }
  const catImage = CAT_IMAGES[room.color] || whiteCat;
  
  const today = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const goalHours = Math.floor((me?.dailyGoalSeconds ?? room.goalMinutes * 60) / 3600);
  const goalRemainder = ((me?.dailyGoalSeconds ?? room.goalMinutes * 60) / 60) % 60;
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
      {askKey && <DeviceKeyDialog deviceCode={room.deviceCode} onConfirm={connectDevice} onCancel={() => setAskKey(false)} />}
      <div className="room-topbar">
        <button type="button" onClick={onBack}>
          ← 처음으로
        </button>
      </div>

      <div className="room-content">
        {(error || queryError || (!device && notice)) && <p className="room-help" role="alert">{error || queryError || (!device && notice)}{error && <button onClick={reconnect}>다시 연결</button>}</p>}
        {/* 1. 산책 탭 상단 영역 */}
        {tab === "walk" && (
          <>
            <header className="room-heading">
              <h1>{snapshot?.name || room.roomName}</h1>
              <p>{today} · {me ? stateText(me.state) : "확인 중"}</p>
            </header>

            <section className="room-my-cat" aria-label="내 고양이">
              <div className="room-avatar">
                <img src={catImage} alt="" />
              </div>

              <div className="room-my-cat-info">
                <div className="room-my-cat-title">
                  <strong>{room.name}</strong>
                  <span>{me ? `${me.ownedCellCount}%` : "—%"}</span>
                </div>

                <div className="room-goal-track" aria-hidden="true" />

                <p>오늘 {me ? studyTime(me.todayStudySeconds) : "확인 중"} · 목표 {goalText}</p>
              </div>
            </section>
          </>
        )}

        {/* 2. 친구 탭 영역 */}
        {tab === "friends" && (
          <>
            <header className="room-heading">
              <h1>우리 방 친구들</h1>
              <p>{snapshot ? `${snapshot.members.length}명이 함께해요` : "참여자를 확인하고 있어요"}</p>
            </header>

            <section className="room-friend-list" aria-label="참여자">
              {(snapshot?.members || []).map(member => (
              <article className="room-friend" key={member.memberId}>
                <div className="room-avatar">
                  <img src={CAT_IMAGES[formColor(member.catColor)] || whiteCat} alt="" />
                </div>

                <div className="room-friend-info">
                  <div className="room-friend-name">
                    <strong>{member.catName}</strong>
                    <span className="room-status">{stateText(member.state)}</span>
                  </div>
                  <p>오늘 {studyTime(member.todayStudySeconds)} · 땅 {member.ownedCellCount}%</p>
                </div>
              </article>
              ))}
            </section>

            <p className="room-help">
              친구들의 공부 상태와 산책 현황이에요.
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
                  ? "친구에게 이 코드를 전달해 주세요."
                  : "방 코드를 확인하고 있어요.")}
            </p>
          </>
        )}

        {/* 3. 기록 탭 상단 영역 */}
        {tab === "records" && (
          <>
            <header className="room-heading">
              <h1>오늘의 산책 지도</h1>
              <p>{today} · {daily ? `오늘 공부 ${studyTime(daily.totalStudyMs / 1000)}` : "기록 확인 중"}</p>
            </header>
          </>
        )}

        {/* 4. 기기 탭 영역 */}
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
              <span className="room-status">{!deviceLoaded ? "확인 중" : !device ? "미등록" : device.connected ? "연결됨" : "연결 대기"}</span>

              <dl className="room-record-values">
                <div>
                  <dt>입력한 기기 코드</dt>
                  <dd>{device?.deviceCode || "미등록"}</dd>
                </div>
                <div>
                  <dt>폰 감지</dt>
                  <dd>{sensorText(device, "phonePresent")}</dd>
                </div>
                <div>
                  <dt>착석 감지</dt>
                  <dd>{sensorText(device, "personPresent")}</dd>
                </div>
              </dl>

              <p className="room-help">
                {device?.connected ? "식빵냥에서 받은 센서 상태예요." : "기기를 연결하고 식빵냥을 켜 주세요."}
                {deviceLoaded && !device && <button type="button" disabled={deviceBusy} onClick={() => setAskKey(true)}>기기 연결</button>}
              </p>
            </section>
          </>
        )}

        {/* 💡 산책 탭과 기록 탭에서만 공통으로 지도를 노출 */}
        {(tab === "walk" || tab === "records") && (
          <section className="room-map-section" aria-label="지도 영역">
            <div>
              {/* 🌟 아래와 같이 currentTab={tab} 을 전달해줍니다 */}
              <MapGrid snapshot={snapshot} showMarkers={tab === "walk"} currentTab={tab} ranking={ranking} />
            </div>
          </section>
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
