const http = require('http');

const data = JSON.stringify({
  email: 'dungbaoviec123@gmail.com',
  password: 'Test@123',
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      const json = JSON.parse(body);
      const token = json.data?.accessToken;
      if (!token) return console.error('Login failed', json);

      console.log('Got token, sending message...');

      // First, verify history
      const getReq = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path: '/api/channels/1/messages',
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + token,
          },
        },
        (res3) => {
          let b3 = '';
          res3.on('data', (c) => (b3 += c));
          res3.on('end', () => {
            console.log('Message history:', JSON.stringify(JSON.parse(b3), null, 2));
          });
        }
      );
      getReq.end();
    });
  }
);

req.write(data);
req.end();
