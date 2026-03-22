const http = require('http');

http.get('http://localhost:3001/api/dashboard/alerts', (res) => {
  let data = '';
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('GET /api/dashboard/alerts Response:', data));
}).on('error', err => console.error(err));
