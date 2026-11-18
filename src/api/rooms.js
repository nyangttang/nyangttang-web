import { request, getSession, saveSession } from './client.js';
export async function ensureUser(nickname, password) {
  const existing = getSession();
  if (existing?.accessToken) {
    if (existing.nickname !== nickname) throw new Error('현재 로그인된 고양이 이름을 확인해 주세요.');
    return existing;
  }
  const user = await request('/api/v1/users', {method:'POST', body:{nickname,password}, auth:false});
  saveSession(user);
  return user;
}
export async function login(nickname, password) {
  const user = await request('/api/v1/users/login', {method:'POST', body:{nickname,password}, auth:false});
  saveSession(user);
  return user;
}
export const setFirstPassword = (nickname, password) => request('/api/v1/users/me/password', {method:'POST',body:{nickname,password}});
export const updateColor = (id, catColor) => request(`/api/v1/rooms/${id}/me/color`, {method:'POST',body:{catColor}});
export const unlinkDevice = (id, expectedDeviceCode) => request(`/api/v1/rooms/${id}/device/unlink`, {method:'POST',body:{expectedDeviceCode}});
export const leaveRoom = (id, memberId) => request(`/api/v1/rooms/${id}/leave`, {method:'POST',body:{memberId}});
export const getMe = signal => request('/api/v1/users/me', {signal});
export const getMyRoom = signal => request('/api/v1/users/me/room', {signal});
export const getSnapshot = (id, signal) => request(`/api/v1/rooms/${id}/snapshot`, {signal});
export const getDevice = (id, signal) => request(`/api/v1/rooms/${id}/devices/me`, {signal});
export const getRanking = (id, signal) => request(`/api/v1/rooms/${id}/ranking?sort=LAND`, {signal});
export const getTodayStudy = (date, signal) => request(`/api/v1/users/me/study/daily?from=${date}&to=${date}`, {signal});
export const createRoom = body => request('/api/v1/rooms', {method:'POST',body});
export const joinRoom = body => request('/api/v1/rooms/join', {method:'POST',body});
export const registerDevice = (id, pairingCode, expectedDeviceCode) => request(`/api/v1/rooms/${id}/device/pair`, {
  method:'POST',body:{pairingCode,expectedDeviceCode},
});
export const getStudySessions = (date, signal) => request(`/api/v1/users/me/study/sessions?date=${encodeURIComponent(date)}`, {signal});
