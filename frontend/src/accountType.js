export function getAccountType() {
  return localStorage.getItem('accountType'); // 'club' or 'player'
}

export function getClubUsername() {
  return localStorage.getItem('clubUsername');
}