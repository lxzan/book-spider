# book-spider
### 简介
> 这是一个NodeJS爬虫项目， 用于爬取[爱去小说网](http://www.aiquxs.com/)的小说资源

> 用到的模快主要有superagent，cheerio，superagent-charset，mysql，cron，bluebird

> 本项目在Ubuntu环境下开发，未进行Windows测试，NodeJS版本为 v7.1.0

> 感谢开发本项目依赖模快的开源界前辈

### 安装
```
git clone https://github.com/lxzan/book-spider.git
npm install (安装速度较慢，建议使用cnpm)
```
> 配置 src/db.js.template的mysql账户密码并将文件文件改名为db.js

> 创建数据库，文件在spider.sql

### 启动

```
node --harmony index.js <url>
url表示小说目录页面url， 如 http://www.aiquxs.com/read/41/41742/index.html
```
