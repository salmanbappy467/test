const axios = require('axios');
const https = require('https');

const agent = new https.Agent({  
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000
});

const client = axios.create({
  httpAgent: agent,
  httpsAgent: agent,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Connection': 'keep-alive'
  },
  timeout: 30000
});

module.exports = client;
