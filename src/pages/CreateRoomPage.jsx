import { enterRoom } from '../api/enterRoom';
import { errorMessage } from '../api/client';
import DeviceKeyDialog from '../components/DeviceKeyDialog';
import { useRef, useState } from "react";
import "./CreateRoomPage.css";
import pawPink from "../assets/paw-pink.png";
import pawBrown from "../assets/paw-brown.png";
import createRoom1 from "../assets/create-room-1.png";
import createRoom2 from "../assets/create-room-2.png";
import createRoom3 from "../assets/create-room-3.png";

const COLORS = [
  { name: "흰냥", value: "#ffffff" },
  { name: "회색냥", value: "#dedbd8" },
  { name: "치즈냥", value: "#ffe0ad" },
  { name: "삼색냥", value: "#d9b786" },
  { name: "검정냥", value: "#8d8580" },
];

export default function CreateRoomPage({ onBack, onPreview }) {  const [step, setStep] = useState(1);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [catName, setCatName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [deviceCode, setDeviceCode] = useState("");
  const [goalMinutes, setGoalMinutes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [askKey, setAskKey] = useState(false);

  function handleNext(event) {
    event.preventDefault();

    if (!roomName.trim()) {
      setMessage("방 이름을 입력해 주세요.");
      return;
    }

    setMessage("");
    setStep(2);
  }

  function handleCreate(event) {
    event.preventDefault();
    if (working.current) return;
    if (deviceCode.trim()) setAskKey(true);
    else submit('');
  }

  async function submit(deviceKey, code = deviceCode) {
    if (working.current) return;
    setAskKey(false); working.current = true; setBusy(true); setMessage('');
    try {
      const result = await enterRoom('create', {roomName, capacity, name:catName, color, deviceCode:code, goalMinutes}, deviceKey);
      setCreatedRoom(result.room); setMessage(result.notice); setStep(3);
    } catch (error) { setMessage(errorMessage(error)); }
    finally { working.current = false; setBusy(false); }
  }

  return (
    <main className="create-page">
      {askKey && <DeviceKeyDialog deviceCode={deviceCode} onConfirm={({code, key}) => submit(key, code)} onCancel={() => setAskKey(false)} />}
      {step < 3 && (
        <button
          className="create-back"
          type="button"
          disabled={busy}
          onClick={() => {
            setMessage("");
            if (step === 1) onBack();
            else setStep(1);
          }}
        >
          ← 뒤로
        </button>
      )}

      <div
        className="create-steps"
        aria-label={`방 생성 ${step}/3단계`}
      >
        {[1, 2, 3].map((number) => (
          <img
            key={number}
            src={number <= step ? pawPink : pawBrown}
            alt=""
            className="create-step-paw"
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="create-illustration" aria-hidden="true">
            <img src={createRoom1} alt="" />
          </div>

          <h1 className="create-title">새 방 만들기</h1>

          <form className="create-form" onSubmit={handleNext}>
            <div className="create-fields">
              <label className="create-field">
                방 이름
                <input
                  disabled={busy}
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  maxLength={20}
                  required
                />
              </label>

                <label className="create-field">
                인원
                <select
                  disabled={busy}
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                    required
                >
                    <option value="" disabled>인원 선택</option>
                    <option value="1">1명</option>
                    <option value="2">2명</option>
                    <option value="3">3명</option>
                    <option value="4">4명</option>
                </select>
                </label>
            </div>

            <p className="create-message" role="status">{message}</p>
            <button className="create-primary" type="submit" disabled={busy}>
              다음
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="create-illustration" aria-hidden="true">
            <img src={createRoom2} alt="" />
          </div>

          <h1 className="create-title">고양이 설정</h1>

          <form className="create-form" onSubmit={handleCreate}>
            <div className="create-fields">
              <label className="create-field">
                고양이 이름
                <input
                  disabled={busy}
                  value={catName}
                  onChange={(event) => setCatName(event.target.value)}
                  maxLength={12}
                  required
                />
              </label>

              <fieldset className="create-colors">
                <legend>고양이 색상</legend>
                <div className="create-color-options">
                  {COLORS.map((item) => (
                    <label className="create-color-option" key={item.value}>
                      <input
                  disabled={busy}
                        type="radio"
                        name="createCatColor"
                        value={item.value}
                        checked={color === item.value}
                        onChange={() => setColor(item.value)}
                      />
                      <span
                        className="create-color-swatch"
                        style={{ background: item.value }}
                      />
                      <span className="create-sr-only">{item.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="create-field">
                식빵냥 연결
                <input
                  disabled={busy}
                  value={deviceCode}
                  onChange={(event) => setDeviceCode(event.target.value)}
                  placeholder="기기 코드"
                />
              </label>

              <label className="create-field">
                목표 시간
                <select
                  disabled={busy}
                  value={goalMinutes}
                  onChange={(event) => setGoalMinutes(event.target.value)}
                  required
                >
                  <option value="" disabled>시간 선택</option>
                    <option value="60">1시간</option>
                    <option value="120">2시간</option>
                    <option value="180">3시간</option>
                    <option value="240">4시간</option>
                    <option value="300">5시간</option>
                    <option value="360">6시간</option>    
                </select>
              </label>
            </div>

            <p className="create-message" role="status">{message}</p>

            <button className="create-primary" type="submit" disabled={busy}>
              입장
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="create-complete">
          <div className="create-illustration">
            <img src={createRoom3} alt="" />
          </div>

          <h1 className="create-title">방이 생성되었어요!</h1>
          <p className="create-summary">
            {createdRoom?.roomName} · 최대 {createdRoom?.capacity}명
          </p>

          <label className="create-field">
            코드를 보내 친구냥과 함께 산책해요
            <input value={createdRoom?.roomCode || ""} readOnly />
          </label>

          <p className="create-message">
            {message || "방 코드로 친구를 초대해 주세요."}
          </p>

          <button
            className="create-primary"
            type="button"
            onClick={() => onPreview(createdRoom, message)}
          >
            메인으로
          </button>
        </div>
      )}
    </main>
  );
}