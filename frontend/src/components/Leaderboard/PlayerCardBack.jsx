// src/components/Leaderboard/PlayerCardBack.jsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import './Leaderboard.css';
import defaultCard from '../../assets/card-bg.jpg'; // ✅ Import default background

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

export default function PlayerCardBack({ player, background }) {
  const {
    elo_history = [1020, 1035, 1010, 1040, 1055, 1060, 1045],
    xp = 875,
    level = 8,
    xp_to_next = 1000,
    match_results = ["W", "L", "W", "W", "L"],
    upcoming_badge = {
      name: "Golden Competitor",
      description: "Win 1 more tournament match",
      icon: "🏆",
    },
  } = player;

  const xpPercentage = Math.round((xp / xp_to_next) * 100);

  const chartData = {
    labels: elo_history.map((_, i) => `M${i + 1}`),
    datasets: [
      {
        label: "Elo",
        data: elo_history,
        fill: false,
        borderColor: "#F97316",
        backgroundColor: "#FDBA74",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: { color: "#fff", font: { size: 10 } },
        grid: { color: "#ffffff20" },
      },
      x: {
        ticks: { color: "#fff", font: { size: 10 } },
        grid: { color: "#ffffff10" },
      },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <div
      className="card-back gamified"
      style={{
        backgroundImage: `url(${background || defaultCard})`,
      }}
    >
      <div className="xp-section">
        <h2 className="text-sm font-bold text-center">Level {level}</h2>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPercentage}%` }} />
        </div>
        <p className="xp-text">{xp} XP / {xp_to_next}</p>
      </div>

      <div className="elo-history">
        <h3 className="chart-title">Elo History</h3>
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="recent-matches">
        <h3 className="chart-title">Recent Matches</h3>
        <div className="match-results-row">
          {match_results.map((res, i) => (
            <div
              key={i}
              className={`match-result ${res === "W" ? "win" : "loss"}`}
            >
              {res}
            </div>
          ))}
        </div>
      </div>

      <div className="upcoming-badge">
        <p>🔒 Upcoming Badge:</p>
        <div className="badge-name">{upcoming_badge.icon} {upcoming_badge.name}</div>
        <p className="badge-desc">{upcoming_badge.description}</p>
      </div>
    </div>
  );
}
