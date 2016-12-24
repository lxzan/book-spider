import charset = require("superagent-charset");
import request = require("superagent");
import Promise = require("bluebird");
import cheerio = require("cheerio");
import fs = require("fs");
import DB = require("./db");
charset(request);

class Spider {
    rooturl: string;
    baseurl: string;
    download_path: string;

    constructor(url) {
        this.rooturl = url;
        this.baseurl = url.replace('index.html', '');
    }

    getPage(url) {
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

   async loader() {
        await DB.querySync('TRUNCATE TABLE `book`');
        let page = await this.getPage( this.rooturl );
        let $ = cheerio.load( page.text );
        let title = $("meta[property='og:novel:book_name']").attr('content');
        this.download_path = './download/' + title;

        if( !fs.existsSync(this.download_path) ) {
            fs.mkdirSync(this.download_path);
        }

        let data = [];
        $("#list dd a").each(function () {
            let node = $(this);
            let href = node.attr('href');
            let title = node.text();
            data.push({
                'href': href,
                'title': title,
                'path': this.download_path
            });
        });
        let sql = 'insert into book (url, title, path) values ';
        for (var i = 0; i < data.length - 1; i++) {
            sql += '(\'' + this.baseurl + data[i].href + '\', ' + '\'' + data[i].title + '\', ' + '\'' + this.download_path + '\'), ';
        }
        sql += '(\'' + this.baseurl + data[i].href + '\', ' + '\'' + data[i].title + '\', ' + '\'' + this.download_path + '\')';
        await DB.querySync(sql);
    }

    async downloadAll() {
        let rows = await DB.querySync('select * from book order by id asc limit 100');
        if(rows.length === 0) {
            console.log('下载完成');
            this.merge();
            process.exit();
        }

        for (var i = 0; i < rows.length; i++) {
            await this.downloadPage(rows[i]);
            await DB.querySync('delete from book where id = :id', {
                ':id': rows[i].id
            });
        }
    }

    async downloadPage(params): void {
        let filename = params.id + '-' + params.title + '.txt';
        let path = params.path + '/' + filename;

        let page = await this.getPage(params.url);
        let html = page.text.replace(/<br.*?\/>/g, '\n');
        let $ = cheerio.load(html);
        let content = $("#booktext").text();
        content = params.title + content.replace(/ads.*?\);/g, '').replace(/天才.*?為您提供精彩小說閱讀。/, '')
        fs.writeFileSync(path, content, 'utf8');
    }

    merge() {
        console.log('开始合并');
        let files = fs.readdirSync(this.download_path).sort(function(a, b) {
            let x = parseInt( a.match(/^[0-9]+\-/g)[0] );
            let y = parseInt( b.match(/^[0-9]+\-/g)[0] );
            return x - y;
        });
        let filepath = this.download_path + '.txt';
        fs.writeFileSync(filepath, '', 'utf8');

        for(let i=0; i<files.length; i++) {
            let content = fs.readFileSync(this.download_path + '/' + files[i], 'utf8');
            fs.appendFileSync(filepath, content, 'utf8');
        }
        console.log('合并完成');
    }
}

module.exports = Spider;
