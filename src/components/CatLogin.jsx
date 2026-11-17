import { useState } from 'react';
import { login, setFirstPassword } from '../api/rooms';
import { errorMessage } from '../api/client';
import '../pages/JoinRoomPage.css';

export default function CatLogin({ previousName, onDone, onBack }) {
  const [name, setName] = useState(previousName || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (previousName) await setFirstPassword(name.trim(), password);
      else await login(name.trim(), password);
      await onDone();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  return <main className="join-page">
    {onBack && <button className="join-back" disabled={busy} onClick={onBack}>← 처음으로</button>}
    <h1 className="join-title">{previousName ? '내 고양이 비밀번호 설정' : '기존 고양이로 로그인'}</h1>
    <form className="join-form" onSubmit={submit}>
      <div className="join-fields">
        <label className="join-field">고양이 이름<input autoComplete="username" required maxLength={12} value={name} onChange={e=>setName(e.target.value)} /></label>
        <label className="join-field">비밀번호<input type="password" autoComplete={previousName ? 'new-password' : 'current-password'} placeholder="6자 이상" required minLength={6} maxLength={64} value={password} onChange={e=>setPassword(e.target.value)} /></label>
      </div>
      <p className="join-message" role="status">{error || (previousName && '다음에도 이 고양이로 돌아올 수 있게 비밀번호를 정해 주세요.')}</p>
      <button className="join-submit" disabled={busy}>{previousName ? '저장' : '로그인'}</button>
    </form>
  </main>;
}
