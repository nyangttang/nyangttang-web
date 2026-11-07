import "./HomePage.css";

export default function HomePage({ onJoin, onCreate }) {
  return (
    <main className="home-page">
      <h1 className="home-title">냥땅 🐾</h1>

      <div className="home-illustration">
        {/* 고양이 원본 이미지를 넣으면 이 부분을 img로 교체 */}
        <span role="img" aria-label="고양이">🐱</span>
      </div>

      <p className="home-description">
        폰을 식빵냥 등에 올려
        <br />
        고양이를 산책시키세요!
      </p>

      <div className="home-actions">
        <button className="home-start" onClick={onCreate}>
          냥땅 시작하기
        </button>

        <p className="home-join">
          이미 방이 있나요?
          <button onClick={onJoin}>방 입장하기</button>
        </p>
      </div>
    </main>
  );
}