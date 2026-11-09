import { useEffect, useRef, useState } from 'react';

// The existing forms stay unchanged; authentication is requested only when connecting a device.
export default function DeviceKeyDialog({ deviceCode, onConfirm, onCancel }) {
  const dialog = useRef(null);
  const [key, setKey] = useState('');
  const [code, setCode] = useState(deviceCode || '');
  useEffect(() => {
    const element = dialog.current; element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onCancel(); }}>
    <form onSubmit={event => { event.preventDefault(); onConfirm({code:code.trim().toUpperCase(),key:key.trim()}); }}>
      <p>기기 연결 확인</p>
      <label>기기 코드 <input value={code} onChange={event => setCode(event.target.value.toUpperCase())} required minLength={3} maxLength={32} pattern="[A-Z0-9]+(-[A-Z0-9]+)*" /></label>
      <br />
      <label>기기 인증 키 <input autoFocus type="password" value={key} onChange={event => setKey(event.target.value)} autoComplete="off" required pattern="[a-f0-9]{64}" minLength={64} maxLength={64} /></label>
      <p>기기 담당자에게 받은 키를 입력해 주세요. 저장하지 않습니다.</p>
      <button type="button" onClick={onCancel}>취소</button>{' '}
      <button type="submit">연결</button>
    </form>
  </dialog>;
}
