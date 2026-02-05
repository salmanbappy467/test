const client = require('./client');
const cheerio = require('cheerio');
const qs = require('querystring');

async function login(userId, password) {
    const url = 'http://www.rebpbs.com/login.aspx';
    try {
        console.log("Attempting to load login page via Proxy...");
        const initialPage = await client.get(url);
        
        const $ = cheerio.load(initialPage.data);
        const initialCookies = initialPage.headers['set-cookie'] || [];
        
        // ViewState না পেলে বুঝব পেজ লোডই হয়নি
        if (!$('#__VIEWSTATE').val()) {
            return { success: false, error: "REB Login Page Failed to Load (Proxy Slow/Down)" };
        }

        const payload = {
            '__VIEWSTATE': $('#__VIEWSTATE').val(),
            '__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val(),
            '__EVENTVALIDATION': $('#__EVENTVALIDATION').val(),
            'txtusername': userId,
            'txtpassword': password,
            'btnLogin': decodeURIComponent('%E0%A6%B2%E0%A6%97%E0%A6%87%E0%A6%A8') 
        };

        console.log("Posting credentials...");
        const response = await client.post(url, qs.stringify(payload), {
            headers: { 
                'Cookie': initialCookies.join('; '),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 500
        });

        const authCookies = response.headers['set-cookie'] || [];
        
        // কুকি মার্জ করা
        const finalCookies = [...new Set([...initialCookies, ...authCookies])];

        // যদি রেসপন্স কুকি না থাকে, মানে পাসওয়ার্ড ভুল বা সার্ভার রিজেক্ট করেছে
        if (authCookies.length === 0) {
            // পেজের ভেতর কোনো এরর মেসেজ আছে কিনা দেখা
            const $res = cheerio.load(response.data);
            const errMsg = $res('span[style*="color:Red"]').text() || "Wrong UserID or Password";
            return { success: false, error: "REB Rejected: " + errMsg };
        }

        return { success: true, cookies: finalCookies };

    } catch (error) {
        console.error("Login Error:", error.message);
        return { success: false, error: "Proxy Connection Error: " + error.message };
    }
}

module.exports = { login };