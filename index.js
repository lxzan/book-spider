(async function() {
    var arguments = process.argv.splice(2);
    const spider = require('./src/spider');
    console.log('开始下载');
    await spider.loader(arguments[0]);
    await spider.run();
    var cronJob = require("cron").CronJob;
    new cronJob('*/20 * * * * *', async function() {
        await spider.run();
    }, null, true, 'Asia/Shanghai');
})();
