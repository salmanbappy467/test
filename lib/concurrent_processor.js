const { verifyLoginDetails } = require('./login_check');
const { postMeterData } = require('./meter_post');

async function processConcurrentBatch(userid, password, meters) {
    let auth = await verifyLoginDetails(userid, password);
    if (!auth.success) return { status: "error", message: auth.message };

    const uploadPromises = meters.map(async (m) => {
        try {
            let result = await postMeterData(auth.cookies, m);
            return {
                meterNo: m.meterNo,
                sealNo: m.sealNo,
                postStatus: result.success ? "SUCCESS" : "FAILED",
                serverError: result.reason,
                isDuplicate: result.isDuplicate || false,
                liveStatus: result.success ? "Saved (Check History)" : "Failed"
            };
        } catch (error) {
            return {
                meterNo: m.meterNo,
                postStatus: "FAILED",
                serverError: "Network Error",
                isDuplicate: false
            };
        }
    });

    const results = await Promise.all(uploadPromises);
    const failedCount = results.filter(r => r.postStatus === "FAILED" && !r.isDuplicate).length;

    return { 
        status: "completed", 
        count: meters.length, 
        failed: failedCount, 
        data: results 
    };
}

module.exports = { processConcurrentBatch };
