
const jwt = require('jsonwebtoken');

// Paste EXACT values:
const SECRET = 'H8ZZCTthFhj1fOoUmNjcac1PJfN1CEmUTuejm071CSVLSTOM8oTi8jbYQoziUvnWUwy6HcfvjQXrrDDSchJZJw==';
const USER_ID = 'd7391650-b1ee-4cc8-b4a8-6ebc6eb014e3'; // must exist in your DB

const token = jwt.sign(
  { sub: USER_ID, role: 'authenticated', aud: 'authenticated' },
  SECRET,
  { algorithm: 'HS256', expiresIn: '2h' }
);

console.log(token);
