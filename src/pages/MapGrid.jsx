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
      const initialCatsWithWait = data.cats.map((cat) => ({
        ...cat,
        waitCount: 0,
      }));
      setCats(initialCatsWithWait);
      setOwners(data.owners);
      if (data.users) {
        setUsers(data.users);
      }
    }
    loadData();
  }, []);

  // 고양이 움직이기 및 대기 판정 로직
  const stepCatWalk = (cat, currentOwners) => {
    if (cat.waitCount && cat.waitCount > 0) {
      return { nextPos: cat.pos, newWaitCount: cat.waitCount - 1 };
    }

    const width = 10;
    const currPos = cat.pos;
    const r = Math.floor(currPos / width);
    const c = currPos % width;

    // 4개의 모서리 본진 좌표
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

    // 절대 침범 금지 : 모서리 칸인데, 주인이 '다른 유저'라면 이동 후보에서 제외
    // 적어도 한칸은 줘야할 것 같아서 일단 막아둠
    const safeNeighbors = neighbors.filter((n) => {
      if (cornerPositions.includes(n.pos)) {
        if (n.owner && n.owner !== cat.id) {
          return false;
        }
      }
      return true;
    });

    // 이동 가능한 후보 찾기 (빈 땅 우선, 없으면 남의 땅 포함 전체)
    let validMoves = safeNeighbors.filter((n) => !n.owner);
    if (validMoves.length === 0) {
      validMoves = safeNeighbors.filter((n) => n.owner !== cat.id);
    }
    if (validMoves.length === 0) {
      validMoves = safeNeighbors;
    }

    if (validMoves.length === 0) return { nextPos: cat.pos, newWaitCount: 0 };

    // 정렬 로직
    validMoves.sort((a, b) => {
      const isTargetOpponent = a.owner && a.owner !== cat.id;

      if (a.dist !== b.dist) {
        if (isTargetOpponent) {
          return b.dist - a.dist;
        } else {
          return a.dist - b.dist;
        }
      }
      return Math.random() - 0.5;
    });

    const targetMove = validMoves[0];
    const nextPos = targetMove.pos;

    // 이동하려는 곳이 '다른 사람의 땅'이면 시간 두배로 소모하기
    const isSteppingOnOpponent =
      targetMove.owner && targetMove.owner !== cat.id;
    const newWaitCount = isSteppingOnOpponent ? 2 : 0; // 2틱 동안 멈춰 서서 대기

    return { nextPos, newWaitCount };
  };

  // 내 모서리랑 거리 구하기
  const getDist = (r, c, userId) => {
    const start = startPositions[userId];
    return Math.abs(r - start.r) + Math.abs(c - start.c);
  };

  // 시간 흐름에 따라 고양이 움직이는 코드
  useEffect(() => {
    if (!isLiveRunning) return;

    const intervalTime = 0.2 * 1000;

    const timer = setInterval(() => {
      setCats((prevCats) => {
        let updatedOwners = { ...owners };

        const newCats = prevCats.map((cat) => {
          if (cat.status === "studying") {
            const { nextPos, newWaitCount } = stepCatWalk(cat, updatedOwners);
            if (cat.pos === nextPos) {
              // 제자리에 멈춰서 대기 카운트를 소모 중인 경우
              return { ...cat, waitCount: newWaitCount };
            } else {
              // 실제로 칸을 이동했거나, 대기가 끝나고 땅을 점령하는 타이밍
              const currentOwner = updatedOwners[nextPos];
              // 빈 땅이거나 내 땅이거나, 혹은 남의 땅이지만 대기를 거쳐 진입한 경우 내 땅으로 변경
              if (
                !currentOwner ||
                currentOwner === cat.id ||
                cat.waitCount === 0
              ) {
                updatedOwners[nextPos] = cat.id;
              }

              return { ...cat, pos: nextPos, waitCount: newWaitCount };
            }
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
                  <span>{currentCat.status === "studying" ? "🐱" : "💤"}</span>
                  {/* 대기 중일 때 표정을 다르게 하거나 표시를 남길 수도 있어요 */}
                  <span
                    className="cat-tag"
                    style={{ backgroundColor: currentCat.color }}
                  >
                    {currentCat.name}{" "}
                    {currentCat.waitCount > 0
                      ? `(대기중 ${currentCat.waitCount})`
                      : ""}
                  </span>
                </div>
              ) : null}

              {/* 그리드 번호 확인용 코드 <span className="cell-num">{cellId + 1}</span>*/}
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
