// src/utils/eloUtils.js

export function calculateNewElo(team1Avg, team2Avg, outcome, k = 32) {
  const expected1 = 1 / (1 + Math.pow(10, (team2Avg - team1Avg) / 400));
  const expected2 = 1 - expected1;

  const newTeam1Avg = Math.round(team1Avg + k * (outcome - expected1));
  const newTeam2Avg = Math.round(team2Avg + k * ((1 - outcome) - expected2));

  return { newTeam1Avg, newTeam2Avg };
}

export function updateEloRatings(playerRatings, winningTeamIds, losingTeamIds) {
  const team1Avg = (playerRatings[winningTeamIds[0]] + playerRatings[winningTeamIds[1]]) / 2;
  const team2Avg = (playerRatings[losingTeamIds[0]] + playerRatings[losingTeamIds[1]]) / 2;

  const { newTeam1Avg, newTeam2Avg } = calculateNewElo(team1Avg, team2Avg, 1);

  return {
    [winningTeamIds[0]]: newTeam1Avg,
    [winningTeamIds[1]]: newTeam1Avg,
    [losingTeamIds[0]]: newTeam2Avg,
    [losingTeamIds[1]]: newTeam2Avg,
  };
}