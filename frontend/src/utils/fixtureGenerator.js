// utils/fixtureGenerator.js
import { v4 as uuidv4 } from "uuid";

/**
 * Generates round-robin fixtures for singles or doubles.
 * @param {Array} players - array of user objects (each must include user_id)
 * @param {string} format - 'singles' or 'doubles'
 * @returns {Array} fixtures - array of match objects per round
 */
export function generateFixtures(players, format = "singles") {
  const fixtures = [];

  if (format === "singles") {
    const playerIds = [...players.map((p) => p.user_id)];
    if (playerIds.length % 2 !== 0) playerIds.push(null); // add bye

    const rounds = playerIds.length - 1;
    const half = playerIds.length / 2;

    for (let round = 0; round < rounds; round++) {
      const matches = [];

      for (let i = 0; i < half; i++) {
        const p1 = playerIds[i];
        const p2 = playerIds[playerIds.length - 1 - i];

        if (p1 && p2) {
          matches.push({
            id: uuidv4(),
            round: round + 1,
            team1: [p1],
            team2: [p2],
            scheduled_date: null,
            result: null,
          });
        }
      }

      // Rotate players (excluding first)
      playerIds.splice(1, 0, playerIds.pop());
      fixtures.push({ round: round + 1, matches });
    }
  }

  if (format === "doubles") {
    const pairs = [];
    for (let i = 0; i < players.length; i += 2) {
      const pair = [players[i]?.user_id, players[i + 1]?.user_id].filter(Boolean);
      if (pair.length === 2) pairs.push(pair);
    }

    if (pairs.length % 2 !== 0) pairs.push([null, null]); // bye team

    const rounds = pairs.length - 1;
    const half = pairs.length / 2;

    const teamIds = pairs.map((pair) => pair);

    for (let round = 0; round < rounds; round++) {
      const matches = [];

      for (let i = 0; i < half; i++) {
        const t1 = teamIds[i];
        const t2 = teamIds[teamIds.length - 1 - i];

        if (!t1.includes(null) && !t2.includes(null)) {
          matches.push({
            id: uuidv4(),
            round: round + 1,
            team1: t1,
            team2: t2,
            scheduled_date: null,
            result: null,
          });
        }
      }

      teamIds.splice(1, 0, teamIds.pop());
      fixtures.push({ round: round + 1, matches });
    }
  }

  return fixtures;
}
