import "./HomePage.css";
import homeCat from "../assets/home-cat.png";

export default function HomePage({ onJoin, onCreate }) {
  return (
    <main className="home-page">
      <h1 className="home-title">냥땅 🐾</h1>

      <div className="home-illustration">
        <img src={homeCat} alt="" />
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