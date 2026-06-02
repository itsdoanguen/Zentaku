const axios = require('axios');
const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign(
    { userId: 2, email: 'dungbaoviec123@example.com' },
    'a*812&2hbBUe012Kawi21A7+_2138hAU"Law1sxcm~aaw!@',
    { expiresIn: '1h' }
  );

  try {
    console.log('Syncing...');
    await axios.get('http://localhost:3500/api/anilist/anime/21', {
      headers: { Authorization: 'Bearer ' + token },
    });
    console.log('Synced! Adding...');
  } catch (err) {
    console.log('Error message:', err.message);
  }
}
test();
