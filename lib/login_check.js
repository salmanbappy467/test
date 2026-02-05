const client = require('./client');
const cheerio = require('cheerio');
const { login } = require('./auth');

async function verifyLoginDetails(userid, password) {
    try {
        const authResult = await login(userid, password);
        
        // যদি লগইন ফাংশন থেকেই ফেইল আসে
        if (!authResult.success) {
            return { success: false, message: authResult.error };
        }

        const cookies = authResult.cookies;
        const dashUrl = 'http://www.rebpbs.com/UI/OnM/frm_OCMeterTesterDashboard.aspx';
        
        const response = await client.get(dashUrl, { headers: { 'Cookie': cookies.join('; ') } });
        const $ = cheerio.load(response.data);

        // ড্যাশবোর্ড ঠিকমতো লোড হয়েছে কিনা চেক
        const pbsName = $('#ctl00_lblPBSname').text().trim();
        const userInfo = $('#ctl00_lblLoggedUser').text().trim();
        
        if (!pbsName && !userInfo) {
             // যদি ড্যাশবোর্ড না আসে, তার মানে লগইন আসলে হয়নি
             return { success: false, message: "Login seemed success but Dashboard failed (Slow Net?)" };
        }

        let zonalName = "Unknown Office";
        if (userInfo.includes(',')) {
            zonalName = userInfo.split(',').pop().replace(']', '').trim();
        }

        return { 
            success: true, 
            cookies: cookies,
            userInfo: userInfo,
            pbs: pbsName || "N/A", 
            zonal: zonalName 
        };
    } catch (error) {
        return { success: false, message: "System Error: " + error.message };
    }
}

module.exports = { verifyLoginDetails };