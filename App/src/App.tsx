import React from "react";
import { Routes, Route, Link } from "react-router-dom";

// If these pages exist in your project, the imports will resolve.
// If not, create quick stubs (see bottom of message).
import Home from "./pages/Home";
import SubmitMatch from "./pages/SubmitMatch";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Club from "./pages/Club";
import Checkout from "./pages/Checkout";

export default function App(): JSX.Element {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Home</Link>
        <Link to="/submit">Submit Match</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/profile">My Profile</Link>
        <Link to="/club">Club</Link>
        <Link to="/checkout">Subscribe</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<SubmitMatch />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/club" element={<Club />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </div>
  );
}
