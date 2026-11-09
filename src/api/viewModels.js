// Keep the original form colors and original map colors separate.
const colors = {
  WHITE: { form:'#ffffff', map:'#E5F1F8' }, GRAY: { form:'#dedbd8', map:'#E0DBD8' },
  CHEESE: { form:'#ffe0ad', map:'#FDDCAC' }, TRICOLOR: { form:'#d9b786', map:'#d9b786' },
  BLACK: { form:'#8d8580', map:'#4D3516' },
};
export const formColor = color => colors[color]?.form || '#ffffff';
export function roomRequest(form) {
  const catColor = Object.keys(colors).find(key => colors[key].form === form.color);
  if (!catColor) throw new Error('고양이 색상을 확인해 주세요.');
  return { catName:form.name.trim(), catColor, dailyGoalSeconds:Number(form.goalMinutes) * 60 };
}
export function roomView(room, deviceCode = '') {
  return { roomId:room.roomId, memberId:room.memberId, roomName:room.name, roomCode:room.inviteCode,
    capacity:room.capacity, name:room.catName, color:formColor(room.catColor),
    goalMinutes:room.dailyGoalSeconds / 60, deviceCode };
}
export function mapView(snapshot) {
  const members = snapshot?.members || [];
  return {
    users: Object.fromEntries(members.map(m => [String(m.memberId), { name:m.catName, color:colors[m.catColor]?.map || '#E5F1F8' }])),
    cats: members.map(m => ({ id:String(m.memberId),name:m.catName,pos:m.y * snapshot.width + m.x,
      color:colors[m.catColor]?.map || '#E5F1F8', status:['STUDYING','AWAY_GRACE'].includes(m.state) ? 'studying' : 'resting', waitCount:0 })),
    owners: Object.fromEntries((snapshot?.owners || []).map((owner,index) => [index,owner == null ? null : String(owner)])),
  };
}
export const stateText = state => ({STUDYING:'공부 중',AWAY_GRACE:'잠깐 자리 비움',AWAY_PAUSED:'자리 비움',RESTING:'휴식 중',OFFLINE:'기기 연결 대기'})[state] || '확인 중';
export const studyTime = seconds => `${Math.floor((seconds || 0) / 3600)}시간 ${Math.floor((seconds || 0) % 3600 / 60)}분`;
export const sensorText = (device, field) => !device ? '미등록' : !device.connected || device[field] == null ? '확인 전' : device[field] ? '감지됨' : '감지 안 됨';
