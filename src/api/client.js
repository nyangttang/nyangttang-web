export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const SESSION_KEY = `nyangttang.session:${API_BASE_URL}`;
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
export function saveSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }
export class ApiError extends Error {
  constructor(message, status, code, requestId) {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.requestId = requestId;
  }
}
export async function request(path, { method = 'GET', body, headers = {}, signal, auth = true } = {}) {
  const token = getSession()?.accessToken;
  if (auth && !token) throw new ApiError('사용자 세션이 필요해요. 처음 화면에서 다시 시작해 주세요.', 401, 'AUTH_REQUIRED');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const detail = payload?.error;
    const error = new ApiError(detail?.message || `요청을 처리하지 못했어요 (${response.status}).`, response.status, detail?.code, detail?.requestId || response.headers.get('X-Request-Id'));
    if (auth && response.status === 401 && detail?.code !== 'DEVICE_AUTH_FAILED' && getSession()?.accessToken === token) {
      clearSession(); window.dispatchEvent(new Event('nyangttang:session-expired'));
    }
    throw error;
  }
  if (payload && Object.hasOwn(payload, 'data')) return payload.data;
  return payload;
}
export function errorMessage(error) {
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return '응답이 늦어지고 있어요. 현재 상태를 확인한 뒤 다시 시도해 주세요.';
  if (error instanceof TypeError) return '서버에 연결하지 못했어요. 인터넷 연결과 접속 주소를 확인해 주세요.';
  return `${error.message}${error.requestId ? ` (문의 번호: ${error.requestId})` : ''}`;
}
