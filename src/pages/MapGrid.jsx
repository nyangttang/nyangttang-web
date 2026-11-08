import React, { useState, useEffect, useRef } from "react";
import "./MapGrid.css";
import { fetchMapData } from "../data/dummyMapData";

export default function MapGrid({ showMarkers = true, currentTab = "walk" }) {
  const gridCells = Array.from({ length: 100 }, (_, index) => index);

  const [cats, setCats] = useState([]);
  const [owners, setOwners] = useState({});
  const [users, setUsers] = useState({});
  const [isLiveRunning, setIsLiveRunning] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 테스트 기록 설정
  const RECORD_INTERVAL = 1000;
  const RECORD_COUNT = 288;

  const dateRef = useRef(
    new Date().toLocaleDateString("sv-SE").replaceAll("-", "."),
  );

  const recordCountRef = useRef(0);

  const catsRef = useRef([]);
  const ownersRef = useRef({});

  const initialCatsRef = useRef([]);
  const initialOwnersRef = useRef({});

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

      catsRef.current = initialCatsWithWait;
      ownersRef.current = data.owners;

      initialCatsRef.current = initialCatsWithWait;
      initialOwnersRef.current = data.owners;

      const saved = JSON.parse(localStorage.getItem("mapPathHistory") || "{}");
      const today = dateRef.current;

      if (!saved[today]) {
        saved[today] = {};
      }

      data.cats.forEach((cat) => {
        if (!Array.isArray(saved[today][cat.id])) {
          saved[today][cat.id] = [];
        }
      });

      localStorage.setItem("mapPathHistory", JSON.stringify(saved));
      setIsDataLoaded(true);
    }

    loadData();
  }, []);

  function getTextColor(hexColor) {
    if (!hexColor) return "#2f3640";

    let color = hexColor.replace("#", "");

    if (color.length === 3) {
      color = color
        .split("")
        .map((c) => c + c)
        .join("");
    }

    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    return yiq >= 128 ? "#2f3640" : "#ffffff";
  }

  const getDist = (r, c, userId) => {
    const start = startPositions[userId];
    return Math.abs(r - start.r) + Math.abs(c - start.c);
  };

  const stepCatWalk = (cat, currentOwners) => {
    if (cat.waitCount && cat.waitCount > 0) {
      return {
        nextPos: cat.pos,
        newWaitCount: cat.waitCount - 1,
      };
    }

    const width = 10;
    const currPos = cat.pos;
    const r = Math.floor(currPos / width);
    const c = currPos % width;

    const cornerPositions = [0, 9, 90, 99];
    const neighbors = [];

    if (r > 0) {
      neighbors.push({
        pos: (r - 1) * width + c,
        dist: getDist(r - 1, c, cat.id),
        owner: currentOwners[(r - 1) * width + c],
      });
    }

    if (r < 9) {
      neighbors.push({
        pos: (r + 1) * width + c,
        dist: getDist(r + 1, c, cat.id),
        owner: currentOwners[(r + 1) * width + c],
      });
    }

    if (c > 0) {
      neighbors.push({
        pos: r * width + (c - 1),
        dist: getDist(r, c - 1, cat.id),
        owner: currentOwners[r * width + (c - 1)],
      });
    }

    if (c < 9) {
      neighbors.push({
        pos: r * width + (c + 1),
        dist: getDist(r, c + 1, cat.id),
        owner: currentOwners[r * width + (c + 1)],
      });
    }

    const safeNeighbors = neighbors.filter((n) => {
      if (cornerPositions.includes(n.pos)) {
        if (n.owner && n.owner !== cat.id) {
          return false;
        }
      }
      return true;
    });

    let validMoves = safeNeighbors.filter((n) => !n.owner);

    if (validMoves.length === 0) {
      validMoves = safeNeighbors.filter((n) => n.owner !== cat.id);
    }

    if (validMoves.length === 0) {
      validMoves = safeNeighbors;
    }

    if (validMoves.length === 0) {
      return {
        nextPos: cat.pos,
        newWaitCount: 0,
      };
    }

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
    const isSteppingOnOpponent =
      targetMove.owner && targetMove.owner !== cat.id;
    const newWaitCount = isSteppingOnOpponent ? 2 : 0;

    return { nextPos, newWaitCount };
  };

  const getNextDate = (dateString) => {
    const [year, month, day] = dateString.split(".").map(Number);
    const date = new Date(year, month - 1, day + 1);

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join(".");
  };

  useEffect(() => {
    if (!isLiveRunning || !isDataLoaded) return;

    const timer = setInterval(() => {
      let updatedOwners = { ...ownersRef.current };

      const newCats = catsRef.current.map((cat) => {
        if (cat.status === "studying") {
          const { nextPos, newWaitCount } = stepCatWalk(cat, updatedOwners);

          if (cat.pos === nextPos) {
            return { ...cat, waitCount: newWaitCount };
          } else {
            const currentOwner = updatedOwners[nextPos];

            if (
              !currentOwner ||
              currentOwner === cat.id ||
              cat.waitCount === 0
            ) {
              updatedOwners[nextPos] = cat.id;
            }

            return {
              ...cat,
              pos: nextPos,
              waitCount: newWaitCount,
            };
          }
        }

        return cat;
      });

      catsRef.current = newCats;
      ownersRef.current = updatedOwners;

      setCats(newCats);
      setOwners(updatedOwners);

      const today = dateRef.current;
      const saved = JSON.parse(localStorage.getItem("mapPathHistory") || "{}");

      if (!saved[today]) {
        saved[today] = {};
      }

      newCats.forEach((cat) => {
        if (!Array.isArray(saved[today][cat.id])) {
          saved[today][cat.id] = [];
        }

        saved[today][cat.id].push(cat.pos);
      });

      recordCountRef.current += 1;
      localStorage.setItem("mapPathHistory", JSON.stringify(saved));

      if (recordCountRef.current >= RECORD_COUNT) {
        const nextDate = getNextDate(today);
        dateRef.current = nextDate;
        recordCountRef.current = 0;

        const resetCats = initialCatsRef.current.map((cat) => ({
          ...cat,
          waitCount: 0,
        }));

        const resetOwners = { ...initialOwnersRef.current };

        catsRef.current = resetCats;
        ownersRef.current = resetOwners;

        setCats(resetCats);
        setOwners(resetOwners);

        saved[nextDate] = {};
        resetCats.forEach((cat) => {
          saved[nextDate][cat.id] = [];
        });

        localStorage.setItem("mapPathHistory", JSON.stringify(saved));
      }
    }, RECORD_INTERVAL);

    return () => clearInterval(timer);
  }, [isLiveRunning, isDataLoaded]);

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

  // 점수(땅 차지 비율) 기준 내림차순 정렬된 유저 배열 생성
  const sortedUsers = Object.entries(users).sort(([idA], [idB]) => {
    return (stats[idB] || 0) - (stats[idA] || 0);
  });

  // 가장 많이 산책한 1등 유저 이름
  const topUserName =
    sortedUsers.length > 0 ? users[sortedUsers[0][0]]?.name : "우나";

  return (
    <>
      <div className="map-container">
        <div className="grid-board">
          {gridCells.map((cellId) => {
            const currentCat = cats.find((cat) => cat.pos === cellId);

            return (
              <div
                key={cellId}
                className="cell"
                style={{
                  backgroundColor: getCellColor(cellId),
                }}
              >
                {showMarkers && currentCat ? (
                  <div
                    className="cat-marker"
                    style={{
                      borderColor: currentCat.color,
                    }}
                  >
                    <span>
                      {currentCat.status === "studying" ? "🐱" : "💤"}
                    </span>

                    <span
                      className="cat-tag"
                      style={{
                        backgroundColor: currentCat.color,
                      }}
                    >
                      {currentCat.name}{" "}
                      {currentCat.waitCount > 0
                        ? `(대기중 ${currentCat.waitCount})`
                        : ""}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* currentTab이 'walk'일 때: 퍼센트 상태창 출력 */}
      {currentTab === "walk" && (
        <div className="stats-container">
          {Object.entries(users).map(([userId, userInfo]) => {
            const dynamicTextColor = getTextColor(userInfo.color);

            return (
              <div
                key={userId}
                className="stat-pill"
                style={{
                  backgroundColor: userInfo.color,
                  color: dynamicTextColor,
                }}
              >
                <span className="stat-text">
                  {userInfo.name} {userId === "user1" && "(나)"}{" "}
                  <b>{stats[userId] || 0}%</b>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* currentTab이 'records'일 때: 정렬된 랭킹 카드 출력 */}
      {currentTab === "records" && (
        <div className="records-below-container">
          <div className="record-summary-text">
            현재 {topUserName}님이 가장 많이 산책했어! 🐾
          </div>

          <section className="ranking-card" aria-label="참여자 순위">
            {sortedUsers.map(([userId, userInfo], index) => {
              const rank = index + 1;
              const isFirst = rank === 1;

              return (
                <div key={userId} className="ranking-item">
                  <div className="rank-left">
                    <span className={`rank-crown ${isFirst ? "" : "empty"}`}>
                      {isFirst ? "👑" : ""}
                    </span>
                    <span className={`rank-number ${isFirst ? "gold" : ""}`}>
                      {rank}
                    </span>
                    <span
                      className="rank-name"
                      style={{ color: userInfo.color }}
                    >
                      {userInfo.name}
                    </span>
                  </div>
                  <span className="rank-time">-- {stats[userId] || 0}%</span>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </>
  );
}
