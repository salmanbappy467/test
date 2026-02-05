const client = require('./client');
const cheerio = require('cheerio');
const qs = require('querystring');

async function getInventoryList(cookies, limit = 50) {
    const url = 'http://www.rebpbs.com/UI/OfficeAutomation/Monitoring/EngineeringAndMaintenance/frmMeterInventoryMonitoring.aspx';
    const cookieStr = cookies.join('; ');
    let allMeters = [];
    let currentPage = 1;

    try {
        const res = await client.get(url, { headers: { 'Cookie': cookieStr } });
        let $ = cheerio.load(res.data);
        allMeters = parseTable($);

        while (allMeters.length < limit) {
            currentPage++;
            const payload = {
                '__EVENTTARGET': 'ctl00$ContentPlaceHolder1$gvMeterLOG',
                '__EVENTARGUMENT': `Page$${currentPage}`,
                '__VIEWSTATE': $('#__VIEWSTATE').val(),
                '__EVENTVALIDATION': $('#__EVENTVALIDATION').val(),
                '__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val()
            };
            const nextRes = await client.post(url, qs.stringify(payload), {
                headers: { 'Cookie': cookieStr, 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            $ = cheerio.load(nextRes.data);
            const newMeters = parseTable($);
            if (newMeters.length === 0) break;
            allMeters = allMeters.concat(newMeters);
        }
        return allMeters.slice(0, limit);
    } catch (e) { return allMeters; }
}

function parseTable($) {
    const list = [];
    $('#ctl00_ContentPlaceHolder1_gvMeterLOG tr').each((i, el) => {
        if (i === 0) return;
        const cols = $(el).children('td');
        if (cols.length >= 9) {
            const mNo = $(cols[1]).text().trim();
            if (mNo.length > 3) { 
                list.push({ 
                    brand: $(cols[0]).text().trim(), 
                    meterNo: mNo, 
                    status: $(cols[2]).text().trim(), 
                    cmo: $(cols[5]).text().trim().replace(/&nbsp;/g, '') || "N/A", 
                    seal: $(cols[6]).text().trim(), 
                    date: $(cols[8]).text().trim() 
                });
            }
        }
    });
    return list;
}
module.exports = { getInventoryList };
