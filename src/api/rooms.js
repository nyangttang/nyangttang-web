import { request, getSession, saveSession } from './client.js';
let creatingUser;
export async function ensureUser(nickname) {
  if (getSession()?.accessToken) return getSession();
  if (!creatingUser) creatingUser = request('/api/v1/users', { method:'POST', body:{nickname}, auth:false })
    .then(user => { saveSession(user); return user; }).finally(() => { creatingUser = null; });
  return creatingUser;
}
export const getMe = signal => request('/api/v1/users/me', {signal});
export const getMyRoom = signal => request('/api/v1/users/me/room', {signal});
export const getSnapshot = (id, signal) => request(`/api/v1/rooms/${id}/snapshot`, {signal});
export const getDevice = (id, signal) => request(`/api/v1/rooms/${id}/devices/me`, {signal});
export const getRanking = (id, signal) => request(`/api/v1/rooms/${id}/ranking?sort=LAND`, {signal});
export const getTodayStudy = (date, signal) => request(`/api/v1/users/me/study/daily?from=${date}&to=${date}`, {signal});
export const createRoom = body => request('/api/v1/rooms', {method:'POST',body});
export const joinRoom = body => request('/api/v1/rooms/join', {method:'POST',body});
export const registerDevice = (id, deviceCode, key) => request(`/api/v1/dev/rooms/${id}/physical-device`, {
  method:'POST',body:{deviceCode},headers:{'X-Device-Key':key},
});
