import React, { useState, useEffect } from "react";
import "./MapGrid.css";
import { fetchMapData } from "../data/dummyMapData";

export default function MapGrid() {
  const gridCells = Array.from({ length: 100 }, (_, index) => index);

  const [cats, setCats] = useState([]);
  const [owners, setOwners] = useState({});
  const [users, setUsers] = useState({});
  const [isLiveRunning, setIsLiveRunning] = useState(true);

  // 각 고양이 첫 좌표 (모서리)
  const startPositions = {
    user1: { r: 0, c: 0 },
    user2: { r: 0, c: 9 },
    user3: { r: 9, c: 0 },
    user4: { r: 9, c: 9 },
  };

  useEffect(() => {
    async function loadData() {
      const data = await fetchMapData();
      setCats(data.cats);
      setOwners(data.owners);
      if (data.users) {
        setUsers(data.users); // 더미데이터에서 유저 정보 불러오기
      }
    }
    loadData();
  }, []);

  // 고양이 움직이기
  // 고양이 움직이기 (다른 유저의 모서리 본진은 절대 침입 불가)
  const stepCatWalk = (cat, currentOwners) => {
    const width = 10;
    const currPos = cat.pos;
    const r = Math.floor(currPos / width);
    const c = currPos % width;

    // 4개의 모서리 본진 좌표 (0:김냥, 9:이냥, 90:박냥, 99:최냥)
    const cornerPositions = [0, 9, 90, 99];

    const neighbors = [];
    if (r > 0)
      neighbors.push({
        pos: (r - 1) * width + c,
        dist: getDist(r - 1, c, cat.id),
        owner: currentOwners[(r - 1) * width + c],
      });
    if (r < 9)
      neighbors.push({
        pos: (r + 1) * width + c,
        dist: getDist(r + 1, c, cat.id),
        owner: currentOwners[(r + 1) * width + c],
      });
    if (c > 0)
      neighbors.push({
        pos: r * width + (c - 1),
        dist: getDist(r, c - 1, cat.id),
        owner: currentOwners[r * width + (c - 1)],
      });
    if (c < 9)
      neighbors.push({
        pos: r * width + (c + 1),
        dist: getDist(r, c + 1, cat.id),
        owner: currentOwners[r * width + (c + 1)],
      });

    // 🚫 절대 침범 금지 필터: 모서리 칸인데, 주인이 '다른 유저'라면 이동 후보에서 아예 제외!
    const safeNeighbors = neighbors.filter((n) => {
      if (cornerPositions.includes(n.pos)) {
        // 모서리 칸의 주인이 존재하고, 그 주인이 내가 아니라면 진입 불가
        if (n.owner && n.owner !== cat.id) {
          return false;
        }
      }
      return true;
    });

    // 1순위: 안전한 이웃 중 아직 아무도 안 밟은 '빈 칸'
    let validMoves = safeNeighbors.filter((n) => !n.owner);

    // 2순위: 빈 칸이 없다면, '내 땅이 아닌 일반 남의 땅' 침공 (모서리는 위에서 이미 차단됨)
    if (validMoves.length === 0) {
      validMoves = safeNeighbors.filter((n) => n.owner !== cat.id);
    }

    // 3순위: 만약 갈 곳이 없다면 안전 이웃 중에서 선택
    if (validMoves.length === 0) {
      validMoves = safeNeighbors;
    }

    if (validMoves.length === 0) return cat.pos;

    // 정렬 로직 (빈 칸은 부채꼴 확장, 남의 땅은 공격적 진격)
    validMoves.sort((a, b) => {
      const isTargetOpponent = a.owner && a.owner !== cat.id;

      if (a.dist !== b.dist) {
        if (isTargetOpponent) {
          return b.dist - a.dist; // 멀어지는 방향 (영토 침공)
        } else {
          return a.dist - b.dist; // 가까워지는 방향 (부채꼴 확장)
        }
      }
      return Math.random() - 0.5; // 동점 시 랜덤 처리
    });

    const nextStep = validMoves[0].pos;
    return nextStep;
  };

  // 내 모서리랑 거리 구하기
  const getDist = (r, c, userId) => {
    const start = startPositions[userId];
    return Math.abs(r - start.r) + Math.abs(c - start.c);
  };

  // 시간 흐름에 따라 고양이 움직이는 코드
  useEffect(() => {
    if (!isLiveRunning) return;

    {
      /* 시간 기준 여기서 설정하기 일단 테스트라서 2초로 해봣어요  */
    }
    const intervalTime = 0.2 * 1000;

    const timer = setInterval(() => {
      setCats((prevCats) => {
        let updatedOwners = { ...owners };

        const newCats = prevCats.map((cat) => {
          if (cat.status === "studying") {
            const nextPos = stepCatWalk(cat, updatedOwners);
            updatedOwners[nextPos] = cat.id;
            return { ...cat, pos: nextPos };
          }
          return cat;
        });

        setOwners(updatedOwners);
        return newCats;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isLiveRunning, owners]);

  const calculateStats = () => {
    const counts = {};
    Object.keys(users).forEach((userId) => {
      counts[userId] = 0;
    });

    Object.values(owners).forEach((ownerId) => {
      if (counts[ownerId] !== undefined) {
        counts[ownerId] += 1;
      }
    });
    return counts;
  };

  const stats = calculateStats();

  // 더미데이터 색상 기반으로 셀 색상 지정
  const getCellColor = (cellId) => {
    const owner = owners[cellId];
    if (owner && users[owner]) {
      return users[owner].color;
    }
    return "#f1f2f6";
  };

  return (
    <div className="map-container">
      <h2>기말고사 냥냥방</h2>
      <div>
        여기다가 본인 정보 넣어줘야함
        <p>고양이 산책중 내 당 nn퍼</p>
        <p>막대기로 목표시간 얼마나 채웠는지 보여주는 곳</p>
      </div>

      <div className="grid-board">
        {gridCells.map((cellId) => {
          const currentCat = cats.find((cat) => cat.pos === cellId);

          return (
            <div
              key={cellId}
              className="cell"
              style={{ backgroundColor: getCellColor(cellId) }}
            >
              {currentCat ? (
                <div
                  className="cat-marker"
                  style={{ borderColor: currentCat.color }}
                >
                  {/*여기서고양이모양이랑 상태 바꿀 수 잇게 하기 */}
                  <span>{currentCat.status === "studying" ? "🐱" : "💤"}</span>
                  <span
                    className="cat-tag"
                    style={{ backgroundColor: currentCat.color }}
                  >
                    {currentCat.name}
                  </span>
                </div>
              ) : (
                <span className="cell-num">{cellId + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="stats-container">
        {Object.entries(users).map(([userId, userInfo]) => (
          <div
            key={userId}
            className="stat-pill"
            style={{ backgroundColor: userInfo.color }}
          >
            <span>
              {userInfo.name} {userId === "user1" && "(나)"}
            </span>
            <b>{stats[userId] || 0}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
