// src/components/Leaderboard/FlipCardWrapper.jsx
import { useState, useEffect } from "react";
import "./Leaderboard.css";

export default function FlipCardWrapper({ front, back }) {
  const [flipped, setFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFlip = () => {
    if (isMobile) setFlipped(!flipped);
  };

  return (
    <div
      className={`flip-container ${flipped ? "flipped" : ""}`}
      onClick={handleFlip}
      onMouseEnter={!isMobile ? () => setFlipped(true) : undefined}
      onMouseLeave={!isMobile ? () => setFlipped(false) : undefined}
    >
      <div className="flipper">
        <div className="front">{front}</div>
        <div className="back">{back}</div>
      </div>
    </div>
  );
}
