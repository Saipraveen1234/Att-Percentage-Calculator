const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/attendance/class/7/range?startDate=2026-03-01&endDate=2026-03-31',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.end();
