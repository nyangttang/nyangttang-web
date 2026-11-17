import { useEffect, useRef, useState } from "react";
import { errorMessage } from "../api/client";

export default function DeviceLabelDialog({ previous, onConfirm, onCancel }) {
  const dialog = useRef(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm(code.trim());
      onCancel();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-label="식빵냥 연결"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <form onSubmit={submit}>
        <label>
          기기 코드{" "}
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={32}
            autoComplete="off"
            placeholder="XXXX-XXXX-XXXX"
          />
        </label>
        <p>
          {previous
            ? "새 기기를 연결하면 기존 식빵냥은 해제돼요."
            : "식빵냥에 붙은 등록 코드를 입력해 주세요."}
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="button" disabled={busy} onClick={onCancel}>
          취소
        </button>{" "}
        <button type="submit" disabled={busy}>
          {previous ? "교체" : "연결"}
        </button>
      </form>
    </dialog>
  );
}
