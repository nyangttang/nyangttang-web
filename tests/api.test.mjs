import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { request, saveSession, getSession, API_BASE_URL } from '../src/api/client.js';
import { connectRoom } from '../src/api/roomSocket.js';
import { createRoom, registerDevice } from '../src/api/rooms.js';
import { mapView, roomRequest } from '../src/api/viewModels.js';
import { enterRoom } from '../src/api/enterRoom.js';

let calls;
beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  globalThis.window = new EventTarget();
  calls = [];
  globalThis.fetch = async (url, options) => { calls.push({url, options}); return new Response(JSON.stringify({data:null}), {status:200}); };
  saveSession({ accessToken:'test-session-only' });
});
test('base URL does not double the API prefix and nullable data is unwrapped', async () => {
  assert.equal(await request('/api/v1/users/me/room'), null);
  assert.equal(calls[0].url, `${API_BASE_URL}/api/v1/users/me/room`);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-session-only');
});
test('device auth failures preserve user session and include per-request device header', async () => {
  globalThis.fetch = async (url, options) => { calls.push({url,options}); return new Response(JSON.stringify({error:{code:'DEVICE_AUTH_FAILED',message:'Invalid device key'}}), {status:401}); };
  await assert.rejects(registerDevice('9','NYANG-0001','test-key'), {code:'DEVICE_AUTH_FAILED'});
  assert.equal(getSession().accessToken, 'test-session-only');
  assert.equal(calls[0].options.headers['X-Device-Key'],'test-key');
  assert.equal(calls[0].url,`${API_BASE_URL}/api/v1/dev/rooms/9/physical-device`);
  assert.equal(JSON.stringify(getSession()).includes('test-key'),false);
});
test('expired user token clears session and notifies the app', async () => {
  let expired = false; window.addEventListener('nyangttang:session-expired', () => expired = true);
  globalThis.fetch = async () => new Response(JSON.stringify({error:{code:'SESSION_EXPIRED'}}),{status:401});
  await assert.rejects(request('/api/v1/users/me'),{status:401});
  assert.equal(getSession(),null); assert.equal(expired,true);
});
test('a late 401 from an old request cannot erase a newer session', async () => {
  globalThis.fetch = async () => { saveSession({accessToken:'new-session'}); return new Response(JSON.stringify({error:{code:'SESSION_EXPIRED'}}),{status:401}); };
  await assert.rejects(request('/api/v1/users/me'));
  assert.equal(getSession().accessToken,'new-session');
});
test('mutations are not automatically retried on network failure', async () => {
  let count=0; globalThis.fetch=async()=>{ count++; throw new TypeError('offline'); };
  await assert.rejects(createRoom({name:'test'})); assert.equal(count,1);
});
test('socket authenticates in a frame, accepts study-time updates, ignores duplicate stream frames, and cleans up', () => {
  const sockets=[];
  globalThis.WebSocket=class {
    static OPEN=1;
    constructor(url){this.url=String(url);this.readyState=1;this.sent=[];sockets.push(this);}
    send(value){this.sent.push(JSON.parse(value));}
    close(){this.closed=true;}
  };
  const snapshots=[];
  const stop=connectRoom('7',{onSnapshot:s=>snapshots.push(s),onStatus:()=>{},onUnavailable:()=>{}});
  const socket=sockets[0];socket.onopen();
  assert.equal(socket.url,`${API_BASE_URL.replace(/^http/, 'ws')}/ws/rooms/7`);
  assert.equal(socket.url.includes('test-session'),false);
  assert.deepEqual(socket.sent[0],{type:'AUTH',accessToken:'test-session-only'});
  for (const [seq,time] of [[1,1],[1,999],[2,2]]) socket.onmessage({data:JSON.stringify({type:'SNAPSHOT',streamSeq:seq,data:{snapshotVersion:1,todayStudySeconds:time}})});
  assert.deepEqual(snapshots.map(s=>s.todayStudySeconds),[1,2]);
  stop();assert.equal(socket.closed,true);
  const next=[];const stop2=connectRoom('7',{onSnapshot:s=>next.push(s),onStatus:()=>{},onUnavailable:()=>{}});
  sockets[1].onmessage({data:JSON.stringify({type:'SNAPSHOT',streamSeq:1,data:{snapshotVersion:1}})});
  assert.equal(next.length,1);stop2();
});

test('existing five colors and minute inputs preserve the API contract', () => {
  assert.deepEqual(roomRequest({name:'삼냥',color:'#d9b786',goalMinutes:'60'}), {catName:'삼냥',catColor:'TRICOLOR',dailyGoalSeconds:3600});
  const map = mapView({width:10,owners:[9,null],members:[{memberId:9,catName:'냥',catColor:'WHITE',x:0,y:0,state:'STUDYING'}]});
  assert.equal(map.users['9'].color, '#E5F1F8'); assert.equal(map.owners[0],'9'); assert.equal(map.cats[0].status,'studying');
});
test('a device authentication failure preserves the created room and user session', async () => {
  globalThis.fetch = async (url, options) => {
    calls.push({url,options});
    if (url.endsWith('/users/me/room')) return Response.json({data:null});
    if (url.endsWith('/physical-device')) return Response.json({error:{code:'DEVICE_AUTH_FAILED',message:'키 확인'}},{status:401});
    return Response.json({data:{roomId:7,name:'방',catName:'냥',catColor:'WHITE',dailyGoalSeconds:3600,inviteCode:'ABC123',capacity:2}});
  };
  const result=await enterRoom('create',{roomName:'방',name:'냥',color:'#ffffff',goalMinutes:60,capacity:2,deviceCode:'NYANG-TEST'},'test-key');
  assert.equal(result.room.roomId,7); assert.equal(result.room.capacity,2); assert.match(result.notice,/기기를 연결하지 못/);
  assert.equal(getSession().accessToken,'test-session-only'); assert.equal(JSON.stringify(result).includes('test-key'),false);
  assert.equal(JSON.parse(calls.find(c=>c.url.endsWith('/rooms')).options.body).capacity,2);
});
test('retrying room creation after response loss restores membership instead of duplicating rooms', async () => {
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json({data:{roomId:7,name:'방',catName:'냥',catColor:'WHITE',dailyGoalSeconds:3600,inviteCode:'ABC123',capacity:2}});};
  const result=await enterRoom('create',{name:'냥',color:'#ffffff',goalMinutes:60,capacity:2,deviceCode:''},'');
  assert.equal(result.room.roomId,7);assert.equal(calls.length,1);assert.equal(calls[0].options.method,'GET');
});
