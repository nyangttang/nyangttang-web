import { enterRoom } from "../api/enterRoom";
import { errorMessage } from "../api/client";
import { getSession } from "../api/client";
import { formColor } from "../api/viewModels";
import { useRef, useState } from "react";
import "./JoinRoomPage.css";
import joinCat from "../assets/join-cat.png";

const COLORS = [
  { name: "흰냥", value: "#ffffff" },
  { name: "회색냥", value: "#dedbd8" },
  { name: "치즈냥", value: "#ffe0ad" },
  { name: "삼색냥", value: "#d9b786" },
  { name: "검정냥", value: "#8d8580" },
];

export default function JoinRoomPage({
  onBack,
  onPreview,
  preferredColor,
  onLogin,
}) {
  const [name, setName] = useState(getSession()?.nickname || "");
  const [color, setColor] = useState(formColor(preferredColor));
  const [deviceCode, setDeviceCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [goalMinutes, setGoalMinutes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [password, setPassword] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (working.current) return;
    submit();
  }

  async function submit() {
    if (working.current) return;
    setDuplicate(false);
    working.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await enterRoom("join", {
        name,
        color,
        deviceCode,
        password,
        roomCode,
        goalMinutes,
      });
      onPreview(result.room, result.notice);
    } catch (error) {
      setMessage(errorMessage(error));
      setDuplicate(error.code === "NICKNAME_TAKEN");
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="join-page">
      <button
        className="join-back"
        disabled={busy}
        type="button"
        onClick={onBack}
      >
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
              disabled={busy}
              readOnly={!!getSession()?.accessToken}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={12}
              required
            />
          </label>

          {!getSession()?.accessToken && (
            <label className="join-field">
              비밀번호
              <input
                type="password"
                autoComplete="new-password"
                placeholder="6자 이상"
                minLength={6}
                maxLength={64}
                required
                disabled={busy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          <fieldset className="join-colors">
            <legend>고양이 색상</legend>
            <div className="join-color-options">
              {COLORS.map((item) => (
                <label className="join-color-option" key={item.value}>
                  <input
                    disabled={busy}
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
              disabled={busy}
              value={deviceCode}
              onChange={(event) => setDeviceCode(event.target.value)}
              placeholder="기기 코드"
              autoComplete="off"
              maxLength={32}
            />
          </label>

          <label className="join-field">
            방 코드
            <input
              disabled={busy}
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              required
            />
          </label>

          <label className="join-field">
            목표 시간
            <select
              disabled={busy}
              value={goalMinutes}
              onChange={(event) => setGoalMinutes(event.target.value)}
              required
            >
              <option value="" disabled>
                시간 선택
              </option>
              <option value="60">1시간</option>
              <option value="120">2시간</option>
              <option value="180">3시간</option>
              <option value="240">4시간</option>
              <option value="300">5시간</option>
              <option value="360">6시간</option>
            </select>
          </label>
        </div>

        <p className="join-message" role="status">
          {message}
          {duplicate && (
            <button type="button" onClick={onLogin}>
              기존 고양이로 로그인
            </button>
          )}
        </p>

        <button className="join-submit" type="submit" disabled={busy}>
          입장
        </button>
      </form>
    </main>
  );
}
