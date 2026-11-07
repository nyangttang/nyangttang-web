import { useState } from "react";
import "./CreateRoomPage.css";

const COLORS = [
  { name: "흰색", value: "#ffffff" },
  { name: "연회색", value: "#dedbd8" },
  { name: "크림색", value: "#ffe0ad" },
  { name: "치즈색", value: "#d9b786" },
  { name: "회색", value: "#8d8580" },
];

export default function CreateRoomPage({ onBack, onPreview }) {  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [catName, setCatName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [deviceCode, setDeviceCode] = useState("");
  const [goalMinutes, setGoalMinutes] = useState("");
  const [message, setMessage] = useState("");

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

    if (!catName.trim() || !deviceCode.trim()) {
      setMessage("고양이 이름과 기기 코드를 확인해 주세요.");
      return;
    }

    // 서버 연결 시 여기에서 방 생성과 방장 등록을 요청해요.
    setMessage("");
    setStep(3);
  }

  return (
    <main className="create-page">
      {step < 3 && (
        <button
          className="create-back"
          type="button"
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
          <span
            key={number}
            className={number === step ? "is-active" : ""}
            aria-hidden="true"
          >
            🐾
          </span>
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="create-illustration" aria-hidden="true">
            📦🐱
          </div>

          <h1 className="create-title">새 방 만들기</h1>

          <form className="create-form" onSubmit={handleNext}>
            <div className="create-fields">
              <label className="create-field">
                방 이름
                <input
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  maxLength={20}
                  required
                />
              </label>

                <label className="create-field">
                인원
                <select
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
            <button className="create-primary" type="submit">
              다음
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="create-illustration" aria-hidden="true">
            🐱🍪
          </div>

          <h1 className="create-title">고양이 설정</h1>

          <form className="create-form" onSubmit={handleCreate}>
            <div className="create-fields">
              <label className="create-field">
                고양이 이름
                <input
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
                  value={deviceCode}
                  onChange={(event) => setDeviceCode(event.target.value)}
                  placeholder="기기 코드"
                  required
                />
              </label>

              <label className="create-field">
                목표 시간
                <select
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

            <button className="create-primary" type="submit">
              생성 미리보기
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="create-complete">
          <div className="create-illustration" aria-hidden="true">
            🎉🐱
          </div>

          <h1 className="create-title">방 생성 완료 미리보기</h1>
          <p className="create-summary">
            {roomName} · 최대 {capacity}명
          </p>

          <label className="create-field">
            코드를 보내 친구랑 함께 산책해요
            <input value="서버 연결 후 발급돼요" readOnly />
          </label>

          <p className="create-message">
            아직 실제 방은 생성되지 않았어요.
          </p>

          <button
            className="create-primary"
            type="button"
            onClick={() =>
              onPreview({
                roomName: roomName.trim(),
                capacity: Number(capacity),
                name: catName.trim(),
                color,
                deviceCode: deviceCode.trim(),
                goalMinutes: Number(goalMinutes),
                roomCode: "",
              })
            }
          >
            방 화면 미리보기
          </button>
        </div>
      )}
    </main>
  );
}