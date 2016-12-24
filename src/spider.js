"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var charset = require("superagent-charset");
var request = require("superagent");
var Promise = require("bluebird");
var cheerio = require("cheerio");
var fs = require("fs");
var DB = require("./db");
charset(request);
var Spider = (function () {
    function Spider(url) {
        this.rooturl = url;
        this.baseurl = url.replace('index.html', '');
    }
    Spider.prototype.getPage = function (url) {
        return new Promise(function (resolve, reject) {
            request.get(url)
                .charset('gbk')
                .end(function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    };
    Spider.prototype.loader = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, $, title, data, sql, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, DB.querySync('TRUNCATE TABLE `book`')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getPage(this.rooturl)];
                    case 2:
                        page = _a.sent();
                        $ = cheerio.load(page.text);
                        title = $("meta[property='og:novel:book_name']").attr('content');
                        this.download_path = './download/' + title;
                        if (!fs.existsSync(this.download_path)) {
                            fs.mkdirSync(this.download_path);
                        }
                        data = [];
                        $("#list dd a").each(function () {
                            var node = $(this);
                            var href = node.attr('href');
                            var title = node.text();
                            data.push({
                                'href': href,
                                'title': title,
                                'path': this.download_path
                            });
                        });
                        sql = 'insert into book (url, title, path) values ';
                        for (i = 0; i < data.length - 1; i++) {
                            sql += '(\'' + this.baseurl + data[i].href + '\', ' + '\'' + data[i].title + '\', ' + '\'' + this.download_path + '\'), ';
                        }
                        sql += '(\'' + this.baseurl + data[i].href + '\', ' + '\'' + data[i].title + '\', ' + '\'' + this.download_path + '\')';
                        return [4 /*yield*/, DB.querySync(sql)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Spider.prototype.downloadAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rows, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, DB.querySync('select * from book order by id asc limit 100')];
                    case 1:
                        rows = _a.sent();
                        if (rows.length === 0) {
                            console.log('下载完成');
                            this.merge();
                            process.exit();
                        }
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < rows.length))
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, this.downloadPage(rows[i])];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, DB.querySync('delete from book where id = :id', {
                                ':id': rows[i].id
                            })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Spider.prototype.downloadPage = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var filename, path, page, html, $, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filename = params.id + '-' + params.title + '.txt';
                        path = params.path + '/' + filename;
                        return [4 /*yield*/, this.getPage(params.url)];
                    case 1:
                        page = _a.sent();
                        html = page.text.replace(/<br.*?\/>/g, '\n');
                        $ = cheerio.load(html);
                        content = $("#booktext").text();
                        content = params.title + content.replace(/ads.*?\);/g, '').replace(/天才.*?為您提供精彩小說閱讀。/, '');
                        fs.writeFileSync(path, content, 'utf8');
                        return [2 /*return*/];
                }
            });
        });
    };
    Spider.prototype.merge = function () {
        console.log('开始合并');
        var files = fs.readdirSync(this.download_path).sort(function (a, b) {
            var x = parseInt(a.match(/^[0-9]+\-/g)[0]);
            var y = parseInt(b.match(/^[0-9]+\-/g)[0]);
            return x - y;
        });
        var filepath = this.download_path + '.txt';
        fs.writeFileSync(filepath, '', 'utf8');
        for (var i = 0; i < files.length; i++) {
            var content = fs.readFileSync(this.download_path + '/' + files[i], 'utf8');
            fs.appendFileSync(filepath, content, 'utf8');
        }
        console.log('合并完成');
    };
    return Spider;
}());
module.exports = Spider;
