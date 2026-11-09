import { ensureUser, getMyRoom, createRoom, joinRoom, registerDevice } from './rooms.js';
import { roomRequest, roomView } from './viewModels.js';
import { errorMessage } from './client.js';
export async function enterRoom(kind, form, deviceKey) {
  const body = roomRequest(form);
  await ensureUser(body.catName);
  // Reconcile a previous successful request before submitting again after a timeout.
  let room = await getMyRoom();
  if (room) {
    if (kind === 'join' && room.inviteCode !== form.roomCode.trim().toUpperCase())
      throw new Error('이미 다른 방에 참여 중이에요. 새로고침하면 기존 방으로 돌아가요.');
  } else {
    room = kind === 'create'
      ? await createRoom({...body, name:form.roomName.trim(), capacity:Number(form.capacity), mode:'NORMAL'})
      : await joinRoom({...body, inviteCode:form.roomCode.trim().toUpperCase()});
    room = {...room, inviteCode:room.inviteCode || form.roomCode?.trim().toUpperCase()};
  }
  let notice = '', registeredCode = '';
  if (form.deviceCode.trim() && deviceKey) {
    try { await registerDevice(room.roomId, form.deviceCode.trim().toUpperCase(), deviceKey); registeredCode = form.deviceCode.trim().toUpperCase(); }
    catch (error) { notice = `방 입장은 완료됐지만 기기를 연결하지 못했어요. ${errorMessage(error)}`; }
  }
  return { room:roomView(room,registeredCode), notice };
}
