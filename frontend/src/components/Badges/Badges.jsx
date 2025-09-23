// src/components/Badges/Badges.jsx
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.js";
import Tooltip from "../Ui/Tooltip.jsx";

const Badges = ({ userId }) => {
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchBadges = useCallback(async () => {
    if (!userId) {
      setBadges([]);
      setEarnedBadges(new Set());
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const [{ data: allBadges, error: badgeError }, { data: userBadges, error: userBadgeError }] =
      await Promise.all([
        supabase.from("badges").select("*"),
        supabase.from("user_badges").select("badge_id").eq("user_id", userId),
      ]);

    if (badgeError || userBadgeError) {
      console.error(badgeError || userBadgeError);
      setErrorMsg("Failed to load badges.");
      setBadges([]);
      setEarnedBadges(new Set());
      setLoading(false);
      return;
    }

    const earnedIds = (userBadges || []).map((b) => b.badge_id);
    setBadges(allBadges || []);
    setEarnedBadges(new Set(earnedIds));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const getBadgeStyle = (tier, locked) => {
    const baseLocked = "bg-gray-100 text-gray-400 border border-gray-300";
    const baseUnlocked = "text-black border";
    const tierColors = {
      Beginner: "bg-green-100 border-green-400",
      Intermediate: "bg-blue-100 border-blue-400",
      Expert: "bg-purple-100 border-purple-400",
      Legendary: "bg-yellow-100 border-yellow-400",
    };
    if (locked) return baseLocked;
    return `${tierColors[tier] || "bg-gray-100 border-gray-300"} ${baseUnlocked}`;
  };

  if (!userId) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Your Badges</h2>
        <p className="text-gray-500">Please sign in to view your badges.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Your Badges</h2>

      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

      {loading ? (
        <p>Loading badges...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {badges.map((badge) => {
            const earned = earnedBadges.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-lg p-4 shadow-md text-center transition duration-300 hover:scale-105 ${getBadgeStyle(
                  badge.tier,
                  !earned
                )}`}
              >
                <div className="text-4xl mb-2">{earned ? badge.emoji || "🏅" : "🔒"}</div>
                <h3 className="font-semibold text-md mb-1">{badge.title}</h3>

                {earned ? (
                  <>
                    <p className="text-sm mb-1">{badge.description}</p>
                    <p className="text-xs italic text-gray-600">{badge.tier}</p>
                  </>
                ) : (
                  <Tooltip content={badge.description || "Locked badge"} position="top">
                    <span className="inline-block text-xs text-gray-600 italic">Locked — hover for info</span>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Badges;
