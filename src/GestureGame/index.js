var express = require('express');
var app = express();

var https = require('https');
var fs = require('fs');
var port = 8080;

app.use('/static', express.static('public'));

// 証明書のファイルを指定する
const options = { 
        key: fs.readFileSync('orekey.pem'),
        cert: fs.readFileSync('orekey.cert')
      };

var server = https.createServer(options,app);

app.get('/', function (req, res) {
        const html_data = fs.readFileSync('index.html','utf-8')
        // レスポンスの HTTP コード
        res.writeHead(200,{
              'content-Type': 'text/html'
          });
        res.write(html_data);
        res.end();
    });
 
// イベント待機                                                                                    
server.listen(port);
console.log(`Server is running : https://localhost:${port}/`);