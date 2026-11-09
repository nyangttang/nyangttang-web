import "./MapGrid.css";
import { mapView } from '../api/viewModels';

export default function MapGrid({ snapshot, showMarkers = true, currentTab = "walk", ranking }) {
  const gridCells = Array.from({ length: 100 }, (_, index) => index);
  const { cats, owners, users } = mapView(snapshot);
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
  const topUserName = ranking?.items?.filter(item => item.rank === 1).map(item => item.catName).join(", ")
    || (sortedUsers.length > 0 ? users[sortedUsers[0][0]]?.name : "—");

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
                  {userInfo.name} {userId === String(snapshot?.myMemberId) && "(나)"}{" "}
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
              const rank = ranking?.items.find(item => String(item.memberId) === userId)?.rank ?? index + 1;
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
