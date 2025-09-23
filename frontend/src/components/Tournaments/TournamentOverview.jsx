// src/components/Tournaments/TournamentOverview.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import TournamentFixtures from "./TournamentFixtures";
import "./Tournaments.css";

const TournamentOverview = ({ user }) => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const fetchTournament = async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (error) setError("Tournament not found.");
      else setTournament(data);

      setLoading(false);
    };

    fetchTournament();
  }, [tournamentId]);

  // Countdown
  useEffect(() => {
    if (!tournament?.start_date) return;

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(tournament.start_date);
      const diff = start - now;

      if (diff <= 0) {
        setCountdown("Tournament has started!");
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        setCountdown(`${days}d ${hours}h ${mins}m until start`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament?.start_date]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) return <p className="loading">Loading tournament details...</p>;
  if (error)
    return (
      <div className="error">
        <p>{error}</p>
        <button className="back-btn" onClick={() => navigate("/tournaments")}>
          ← Back
        </button>
      </div>
    );

  return (
    <section className="tournament-overview">
      <button className="back-btn" onClick={() => navigate("/tournaments")}>
        ← Back
      </button>
      <h2>{tournament.name}</h2>
      <p className="date-location">
        <strong>Date:</strong> {formatDate(tournament.start_date)} –{" "}
        {formatDate(tournament.end_date)}
        <br />
        <strong>Location:</strong> {tournament.location}
        <br />
        <strong>Type:</strong> {tournament.type}
        <br />
        <strong>Countdown:</strong>{" "}
        <span className="countdown">{countdown}</span>
      </p>

      <section className="description-section">
        <h3>Description</h3>
        <p>{tournament.description || "No detailed description available."}</p>
      </section>

      <section className="extra-info">
        <h3>Winners</h3>
        {tournament.winners && tournament.winners.length > 0 ? (
          <ul>
            {tournament.winners.map((winner, i) => (
              <li key={i}>{winner}</li>
            ))}
          </ul>
        ) : (
          <p>Winners will be announced after the tournament.</p>
        )}
      </section>

      <section className="extra-info">
        <h3>Bracket</h3>
        {tournament.bracket_url ? (
          <iframe
            src={tournament.bracket_url}
            title="Tournament Bracket"
            width="100%"
            height="400"
            style={{ border: "none", borderRadius: "1rem" }}
          />
        ) : (
          <p>Bracket coming soon…</p>
        )}
      </section>

      <TournamentFixtures tournamentId={tournament.id} user={user} />
    </section>
  );
};

export default TournamentOverview;
