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
  const RECORD_INTERVAL = 1000; // 1초마다 이동 및 기록
  const RECORD_COUNT = 288; // 288번 기록하면 하루 종료

  // 현재 날짜와 기록 횟수
  const dateRef = useRef(
    new Date().toLocaleDateString("sv-SE").replaceAll("-", "."),
  );

  const recordCountRef = useRef(0);

  // 최신 고양이 및 땅 정보
  const catsRef = useRef([]);
  const ownersRef = useRef({});

  // 최초 판 상태 보관
  const initialCatsRef = useRef([]);
  const initialOwnersRef = useRef({});

  // 각 고양이 첫 좌표 (모서리)
  const startPositions = {
    user1: { r: 0, c: 0 },
    user2: { r: 0, c: 9 },
    user3: { r: 9, c: 0 },
    user4: { r: 9, c: 9 },
  };

  // 최초 데이터 불러오기
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

      // 최신 데이터 저장
      catsRef.current = initialCatsWithWait;
      ownersRef.current = data.owners;

      // 리셋할 때 사용할 최초 데이터 저장
      initialCatsRef.current = initialCatsWithWait;
      initialOwnersRef.current = data.owners;

      // 오늘 날짜의 기록 배열 생성
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

  // 배경색에 따라 적절한 글자색 반환
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

  // 내 모서리와의 거리 계산
  const getDist = (r, c, userId) => {
    const start = startPositions[userId];

    return Math.abs(r - start.r) + Math.abs(c - start.c);
  };

  // 고양이 이동 및 대기 판정
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

    // 4개의 모서리 본진 좌표
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

    // 다른 유저가 소유한 모서리는 진입 금지
    const safeNeighbors = neighbors.filter((n) => {
      if (cornerPositions.includes(n.pos)) {
        if (n.owner && n.owner !== cat.id) {
          return false;
        }
      }

      return true;
    });

    // 빈 땅 우선
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

    // 이동 후보 정렬
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

    // 다른 사람의 땅에 들어가면 대기
    const isSteppingOnOpponent =
      targetMove.owner && targetMove.owner !== cat.id;

    const newWaitCount = isSteppingOnOpponent ? 2 : 0;

    return { nextPos, newWaitCount };
  };

  // 날짜를 하루 증가시키는 함수
  const getNextDate = (dateString) => {
    const [year, month, day] = dateString.split(".").map(Number);

    const date = new Date(year, month - 1, day + 1);

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join(".");
  };

  // 고양이 이동 및 위치 기록
  useEffect(() => {
    if (!isLiveRunning || !isDataLoaded) return;

    const timer = setInterval(() => {
      let updatedOwners = { ...ownersRef.current };

      // 모든 고양이 이동
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

      // 최신 위치 및 소유권 갱신
      catsRef.current = newCats;
      ownersRef.current = updatedOwners;

      setCats(newCats);
      setOwners(updatedOwners);

      // 현재 날짜의 기록 불러오기
      const today = dateRef.current;

      const saved = JSON.parse(localStorage.getItem("mapPathHistory") || "{}");

      // 날짜별 기록이 없으면 생성
      if (!saved[today]) {
        saved[today] = {};
      }

      // 사용자별 배열이 없으면 생성
      newCats.forEach((cat) => {
        if (!Array.isArray(saved[today][cat.id])) {
          saved[today][cat.id] = [];
        }

        saved[today][cat.id].push(cat.pos);
      });

      recordCountRef.current += 1;

      // 기록 저장
      localStorage.setItem("mapPathHistory", JSON.stringify(saved));

      // 288번 기록하면 하루 종료
      if (recordCountRef.current >= RECORD_COUNT) {
        // 다음 날짜 계산
        const nextDate = getNextDate(today);
        dateRef.current = nextDate;

        // 기록 횟수 초기화
        recordCountRef.current = 0;

        // 판을 최초 상태로 초기화
        const resetCats = initialCatsRef.current.map((cat) => ({
          ...cat,
          waitCount: 0,
        }));

        const resetOwners = { ...initialOwnersRef.current };

        catsRef.current = resetCats;
        ownersRef.current = resetOwners;

        setCats(resetCats);
        setOwners(resetOwners);

        // 다음 날짜 기록 배열 생성
        saved[nextDate] = {};

        resetCats.forEach((cat) => {
          saved[nextDate][cat.id] = [];
        });

        localStorage.setItem("mapPathHistory", JSON.stringify(saved));

        console.log(`${nextDate} 시작!`);
      }
    }, RECORD_INTERVAL);

    return () => clearInterval(timer);
  }, [isLiveRunning, isDataLoaded]);

  // 유저별 점령 칸 계산
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

  // 칸의 배경색 반환
  const getCellColor = (cellId) => {
    const owner = owners[cellId];

    if (owner && users[owner]) {
      return users[owner].color;
    }

    return "#f1f2f6";
  };

  const sortedUserEntries = Object.entries(users).sort(([idA], [idB]) => {
    return (stats[idB] || 0) - (stats[idA] || 0);
  });
  const topUserName = sortedUserEntries[0]?.[1]?.name || "우나";

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
                {/* showMarkers가 true일 때만 고양이 마커 표시 */}
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

      <div>
        <p></p>
      </div>

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
    </>
  );
}
