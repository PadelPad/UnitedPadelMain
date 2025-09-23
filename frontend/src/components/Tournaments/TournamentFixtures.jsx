// src/components/Tournaments/TournamentFixtures.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Tournaments.css";

const TournamentFixtures = ({ tournamentId, user }) => {
  const [fixtures, setFixtures] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchFixtures = async () => {
      setLoading(true);
      const { data: fx, error } = await supabase
        .from("match_fixtures")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round")
        .order("scheduled_date", { ascending: true });

      if (error) {
        console.error("Error loading fixtures", error);
        setFixtures([]);
        setLoading(false);
        return;
      }

      setFixtures(fx || []);

      if (fx && fx.length) {
        const userIds = [
          ...new Set(fx.flatMap((f) => [...(f.team1_ids || []), ...(f.team2_ids || [])])),
        ];
        if (userIds.length) {
          const { data: players } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);

          const playerMap = {};
          players?.forEach((p) => {
            playerMap[p.id] = p;
          });
          setProfiles(playerMap);
        }
      }
      setLoading(false);
    };

    fetchFixtures();
  }, [tournamentId]);

  const handleReschedule = async (fixtureId, newDate) => {
    await supabase.from("match_fixtures").update({ scheduled_date: newDate }).eq("id", fixtureId);
  };

  const handleResultSubmit = async (fixtureId, score, winner) => {
    await supabase
      .from("match_fixtures")
      .update({
        result: { score, winner },
      })
      .eq("id", fixtureId);
  };

  const renderTeam = (ids = []) => (
    <div className="fixture-team">
      {ids.map((id) => {
        const player = profiles[id];
        return player ? (
          <div key={id} className="fixture-player">
            <img src={player.avatar_url} alt={player.username} />
            <span>{player.username}</span>
          </div>
        ) : (
          <span key={id}>Unknown</span>
        );
      })}
    </div>
  );

  if (loading) return <p className="loading">Loading fixtures…</p>;
  if (!fixtures.length) return <p className="no-results">No fixtures yet.</p>;

  const grouped = fixtures.reduce((acc, fx) => {
    acc[fx.round] = acc[fx.round] || [];
    acc[fx.round].push(fx);
    return acc;
  }, {});

  return (
    <section className="fixture-list">
      {Object.entries(grouped).map(([round, matches]) => (
        <div className="fixture-round" key={round}>
          <h3>Round {round}</h3>
          {matches.map((match) => (
            <div key={match.id} className="fixture-card">
              <div className="fixture-teams">
                {renderTeam(match.team1_ids)}
                <span className="vs">VS</span>
                {renderTeam(match.team2_ids)}
              </div>

              <div className="fixture-details">
                <p className="fixture-date">
                  {match.scheduled_date
                    ? new Date(match.scheduled_date).toLocaleString()
                    : "Date TBD"}
                </p>

                {match.result ? (
                  <p className="fixture-result">
                    <strong>Result:</strong> {match.result.score} <br />
                    <span className="winner">
                      Winner: {match.result.winner === "team1" ? "Team 1" : "Team 2"}
                    </span>
                  </p>
                ) : (
                  <p className="fixture-result">No result yet</p>
                )}

                {isAdmin && (
                  <div className="admin-controls">
                    <input
                      type="datetime-local"
                      onChange={(e) =>
                        handleReschedule(match.id, new Date(e.target.value).toISOString())
                      }
                    />
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const score = e.target.score.value;
                        const winner = e.target.winner.value;
                        handleResultSubmit(match.id, score, winner);
                      }}
                    >
                      <input name="score" placeholder="e.g. 6-4 6-3" required />
                      <select name="winner">
                        <option value="team1">Team 1</option>
                        <option value="team2">Team 2</option>
                      </select>
                      <button type="submit">Save Result</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};

export default TournamentFixtures;
