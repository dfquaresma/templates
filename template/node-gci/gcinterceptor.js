const v8 = require('v8');

const gciHeader = 'gci';

function getYoungGenUsage() {
    return v8.getHeapSpaceStatistics()
        .filter((p)=>{ return p.space_name == "new_space" })[0]
        .space_used_size;
}

module.exports = function (req, res) {
    shouldGC = getYoungGenUsage() > parseInt(req.headers[gciHeader]);
    if (shouldGC) {
        global.gc();
    }
    res.send(shouldGC ? '1' : '0');
};
