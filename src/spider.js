const charset = require('superagent-charset');
const request = require('superagent');
const Promise = require('bluebird');
const cheerio = require("cheerio");
const fs = require("fs");
const flow = require("async");
const DB = require("./db");
charset(request);
var download_path = '';

function getPage(url) {
    return new Promise(function(resolve, reject) {
        request.get(url)
            .charset('gbk')
            .end(function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
    });
}

async function downloadPage(params) {
    let filename = params.id + '-' + params.title + '.txt';
    let path = params.path + '/' + filename;

    let page = await getPage(params.url);
    let html = page.text.replace(/<br.*?\/>/g, '\n');
    let $ = cheerio.load(html);
    let content = $("#booktext").text();
    content = params.title + content.replace(/ads.*?\);/g, '').replace(/天才.*?為您提供精彩小說閱讀。/, '');
    fs.writeFileSync(path, content, 'utf8');
}

function merge() {
    console.log('开始合并');
    let files = fs.readdirSync(download_path).sort(function(a, b) {
        let x = parseInt( a.match(/^[0-9]+\-/g)[0] );
        let y = parseInt( b.match(/^[0-9]+\-/g)[0] );
        return x - y;
    });
    let filepath = download_path + '.txt';
    fs.writeFileSync(filepath, '', 'utf8');

    for(let i=0; i<files.length; i++) {
        let content = fs.readFileSync(download_path + '/' + files[i], 'utf8');
        fs.appendFileSync(filepath, content, 'utf8');
    }
    console.log('合并完成');
}

module.exports = {
    loader: async function(url) {
        await DB.querySync('TRUNCATE TABLE `book`');

        let baseurl = url.replace('index.html', '');
        let page = await getPage(url);
        let $ = cheerio.load(page.text);
        let title = $("meta[property='og:novel:book_name']").attr('content');
        download_path = './download/' + title;

        if (!fs.existsSync('./download')) {
            fs.mkdirSync('./download');
        }

        if (!fs.existsSync(download_path)) {
            fs.mkdirSync(download_path);
        }

        let data = [];
        $("#list dd a").each(function() {
            let node = $(this);
            let href = node.attr('href');
            let title = node.text();
            data.push({
                'href': href,
                'title': title,
                'path': download_path
            });
        });
        let sql = 'insert into book (url, title, path) values ';
        for (var i = 0; i < data.length - 1; i++) {
            sql += '(\'' + baseurl + data[i].href + '\', ' + '\'' + data[i].title + '\', ' + '\'' + download_path + '\'), ';
        }
        sql += '(\'' + baseurl + data[i].href + '\', ' + '\'' + data[i].title + '\', ' + '\'' + download_path + '\')';
        await DB.querySync(sql);
    },

    run: async function() {
        let rows = await DB.querySync('select * from book order by id asc limit 100');
        if(rows.length === 0) {
            console.log('下载完成');
            merge();
            process.exit();
        }

        flow.each(rows, async function(item, callback) {
            await downloadPage(item);
            await DB.querySync('delete from book where id = :id', {
                ':id': item.id
            });
            callback();
        }, function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
}
