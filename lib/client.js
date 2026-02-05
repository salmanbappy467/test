const { Client } = require('ssh2');
const http = require('http');
const axios = require('axios');

// আপনার দেওয়া SSH ক্রেডেনশিয়াল
const SSH_CONFIG = {
    host: 'bd2.vpnjantit.com',
    port: 22,
    username: 'salmanbappy8-vpnjantit.com',
    password: '666666aa',
    readyTimeout: 20000,
    keepaliveInterval: 10000
};

let sshConn;
let sshReady = false;

function getSSHConnection() {
    return new Promise((resolve, reject) => {
        if (sshReady && sshConn) return resolve(sshConn);

        console.log("Connecting to BD SSH Tunnel...");
        const conn = new Client();
        
        conn.on('ready', () => {
            console.log("✅ SSH Tunnel Connected");
            sshReady = true;
            sshConn = conn;
            resolve(conn);
        }).on('error', (err) => {
            console.error("❌ SSH Error:", err.message);
            sshReady = false;
            reject(err);
        }).on('end', () => {
            sshReady = false;
        }).connect(SSH_CONFIG);
    });
}

const tunnelAgent = new http.Agent({
    keepAlive: true,
    createConnection: (options, cb) => {
        getSSHConnection().then((conn) => {
            conn.forwardOut(
                '127.0.0.1', 12345,
                options.host, 80,
                (err, stream) => {
                    if (err) {
                        conn.end();
                        return cb(err);
                    }
                    cb(null, stream);
                }
            );
        }).catch((err) => cb(err));
    }
});

const client = axios.create({
    httpAgent: tunnelAgent,
    timeout: 30000,
    headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Connection': 'keep-alive'
    }
});

module.exports = client;