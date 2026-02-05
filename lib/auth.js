const client = require('./client');
const cheerio = require('cheerio');
const qs = require('querystring');

async function login(userId, password) {
    const url = 'http://www.rebpbs.com/login.aspx';
    try {
        const initialPage = await client.get(url);
        const $ = cheerio.load(initialPage.data);
        const initialCookies = initialPage.headers['set-cookie'] || [];

        const payload = {
            '__VIEWSTATE': $('#__VIEWSTATE').val(),
            '__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val(),
            '__EVENTVALIDATION': $('#__EVENTVALIDATION').val(),
            'txtusername': userId,
            'txtpassword': password,
            'btnLogin': decodeURIComponent('%E0%A6%B2%E0%A6%97%E0%A6%87%E0%A6%A8') 
        };

        const response = await client.post(url, qs.stringify(payload), {
            headers: { 
                'Cookie': initialCookies.join('; '),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 500
        });

        const authCookies = response.headers['set-cookie'] || [];
        return [...new Set([...initialCookies, ...authCookies])];
    } catch (error) {
        console.error("Login Proxy Error:", error.message);
        return null;
    }
}

module.exports = { login };