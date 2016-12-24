(async function() {
    var arguments = process.argv.splice(2);
    const Spider = require('./src/spider');
    let book = new Spider(arguments[0]);

    console.log('开始下载');
    await book.loader();
    await book.downloadAll();

    var cronJob = require("cron").CronJob;
    new cronJob('*/30 * * * * *', function() {
        book.downloadAll();
    }, null, true, 'Asia/Shanghai');
})();
