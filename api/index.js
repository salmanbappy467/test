const express = require('express');
const cors = require('cors');
const { verifyLoginDetails } = require('../lib/login_check');
const { processConcurrentBatch } = require('../lib/concurrent_processor');
const { verifyMeter } = require('../lib/meter_check');
const { getInventoryList } = require('../lib/fetch_inventory');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
    res.send("REB Automation API is Running on Vercel!");
});

app.post('/api/login-check', async (req, res) => {
    try {
        const result = await verifyLoginDetails(req.body.userid, req.body.password);
        if (result.success) {
            res.json({ status: "success", user: result.userInfo, pbs: result.pbs, zonal: result.zonal });
        } else {
            res.status(401).json({ status: "failed", message: result.message });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/meter-post', async (req, res) => {
    try {
        const result = await processConcurrentBatch(req.body.userid, req.body.password, req.body.meters);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/single-check', async (req, res) => {
    try {
        const auth = await verifyLoginDetails(req.body.userid, req.body.password);
        if (!auth.success) return res.status(401).json({ error: "Login Failed" });
        const result = await verifyMeter(auth.cookies, req.body.meterNo);
        res.json(result.found ? { status: "found", data: result.data } : { status: "not_found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/all-meter-list', async (req, res) => {
    try {
        const auth = await verifyLoginDetails(req.body.userid, req.body.password);
        if (!auth.success) return res.status(401).json({ error: "Login Failed" });
        const limit = req.body.limit > 100 ? 100 : (req.body.limit || 50);
        const data = await getInventoryList(auth.cookies, limit);
        res.json({ status: "success", count: data.length, data: data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
