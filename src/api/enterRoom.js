import { ensureUser, getMyRoom, createRoom, joinRoom, registerDevice, getDevice, updateColor } from './rooms.js';
import { roomRequest, roomView } from './viewModels.js';
import { errorMessage } from './client.js';
export async function enterRoom(kind, form) {
  const body = roomRequest(form);
  await ensureUser(body.catName, form.password);
  // Reconcile a previous successful request before submitting again after a timeout.
  let room = await getMyRoom();
  let device = null;
  if (room) {
    if (kind === 'join' && room.inviteCode !== form.roomCode.trim().toUpperCase())
      throw new Error('이미 다른 방에 참여 중이에요. 새로고침하면 기존 방으로 돌아가요.');
    if (room.catColor !== body.catColor) {
      await updateColor(room.roomId, body.catColor);
      room = {...room, catColor:body.catColor};
    }
    device = await getDevice(room.roomId);
  } else {
    room = kind === 'create'
      ? await createRoom({...body, name:form.roomName.trim(), capacity:Number(form.capacity), mode:'NORMAL'})
      : await joinRoom({...body, inviteCode:form.roomCode.trim().toUpperCase()});
    room = {...room, inviteCode:room.inviteCode || form.roomCode?.trim().toUpperCase()};
  }
  let notice = '', registeredCode = device?.deviceCode || '';
  if (form.deviceCode.trim()) {
    try { const result = await registerDevice(room.roomId, form.deviceCode.trim(), device?.deviceCode); registeredCode = result.deviceCode; }
    catch (error) { notice = `방 입장은 완료됐지만 기기를 연결하지 못했어요. ${errorMessage(error)}`; }
  }
  return { room:roomView(room,registeredCode), notice };
}
