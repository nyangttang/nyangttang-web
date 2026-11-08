// [더미 데이터 파일] user1~user4 초기 위치, 모서리 영토, 유저 정보 설정

// status에 들어갈 수 있는 값들: resting, away, studying
export const initialCats = [
  { id: "user1", name: "김냥", pos: 0, color: "#E5F1F8", status: "studying" }, // 0번 위치 (좌상단)
  { id: "user2", name: "이냥", pos: 9, color: "#E0DBD8", status: "studying" }, // 9번 위치 (우상단)
  { id: "user3", name: "박냥", pos: 90, color: "#FDDCAC", status: "resting" }, // 90번 위치 (좌하단)
  { id: "user4", name: "최냥", pos: 99, color: "#4D3516", status: "away" }, // 99번 위치 (우하단)
];

// 유저별 기본 정보 (이름, 색상, 시작 모서리 좌표 등)
export const initialUsers = {
  user1: { name: "김냥", color: "#E5F1F8", startPos: { r: 0, c: 0 } },
  user2: { name: "이냥", color: "#E0DBD8", startPos: { r: 0, c: 9 } },
  user3: { name: "박냥", color: "#FDDCAC", startPos: { r: 9, c: 0 } },
  user4: { name: "최냥", color: "#4D3516", startPos: { r: 9, c: 9 } },
};

export const initialOwners = {
  0: "user1",
  1: "user1",
  10: "user1",
  11: "user1",
  8: "user2",
  9: "user2",
  18: "user2",
  19: "user2",
  80: "user3",
  81: "user3",
  90: "user3",
  91: "user3",
  88: "user4",
  89: "user4",
  98: "user4",
  99: "user4",
};

export async function fetchMapData() {
  return {
    cats: initialCats,
    owners: initialOwners,
    users: initialUsers, // 유저 정보도 함께 반환
  };
}
