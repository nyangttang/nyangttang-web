import { useState } from "react";
import "./JoinRoomPage.css";
import joinCat from "../assets/join-cat.png";

const COLORS = [
  { name: "흰색", value: "#ffffff" },
  { name: "연회색", value: "#dedbd8" },
  { name: "크림색", value: "#ffe0ad" },
  { name: "치즈색", value: "#d9b786" },
  { name: "회색", value: "#8d8580" },
];

export default function JoinRoomPage({ onBack, onPreview }) {  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [deviceCode, setDeviceCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [goalMinutes, setGoalMinutes] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    // 다음 단계에서 이 값으로 서버에 입장을 요청할 예정
    const form = {
      name: name.trim(),
      color,
      deviceCode: deviceCode.trim(),
      roomCode: roomCode.trim(),
      goalMinutes: Number(goalMinutes),
    };

    if (!form.name || !form.deviceCode || !form.roomCode) {
      setMessage("이름, 기기 코드, 방 코드를 확인해 주세요.");
      return;
    }

    onPreview({
      ...form,
      roomName: "참여할 방",
      capacity: null,
    });  }

  return (
    <main className="join-page">
      <button className="join-back" type="button" onClick={onBack}>
        ← 처음으로
      </button>

      <h1 className="join-title">입장하기</h1>

      <div className="join-illustration">
        <img src={joinCat} alt="" />
      </div>

      <form className="join-form" onSubmit={handleSubmit}>
        <div className="join-fields">
          <label className="join-field">
            고양이 이름
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={12}
              required
            />
          </label>

          <fieldset className="join-colors">
            <legend>고양이 색상</legend>
            <div className="join-color-options">
              {COLORS.map((item) => (
                <label className="join-color-option" key={item.value}>
                  <input
                    type="radio"
                    name="catColor"
                    value={item.value}
                    checked={color === item.value}
                    onChange={() => setColor(item.value)}
                  />
                  <span
                    className="join-color-swatch"
                    style={{ background: item.value }}
                  />
                  <span className="join-sr-only">{item.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="join-field">
            식빵냥 연결
            <input
              value={deviceCode}
              onChange={(event) => setDeviceCode(event.target.value)}
              placeholder="기기 코드"
              required
            />
          </label>

          <label className="join-field">
            방 코드
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              required
            />
          </label>

          <label className="join-field">
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

        <p className="join-message" role="status">{message}</p>

        <button className="join-submit" type="submit">
          입장
        </button>
      </form>
    </main>
  );
}