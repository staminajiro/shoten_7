# カメラの中でいくつとれるかな？ゲーム
## はじめに  
カメラの中でいくつとれるかな？ゲームは、WebカメラとWebブラウザだけで手軽に遊べるジェスチャゲームです。  
落ちてくるお菓子を手でキャッチすると得点が得られます。  

このゲームのベースとなっているプログラム(https://github.com/gnavi-blog/posenet_sample)の詳細は、  
ぐるなびさんのテックブログ(https://developers.gnavi.co.jp/entry/posenet/hasegawa)で紹介されています。

posenet_sampleに以下のような機能を追加し、より遊びやすく・楽しいものに仕上げました。

- Webアプリ化
- 操作インタフェースの追加
- 効果音の追加
- 落ちてくるものをお菓子に変更

本書では、追加した機能について簡単に紹介します。  

また、このゲームは、Googleが開発している姿勢推定のJSライブラリ「PoseNet」を利用しているため、  
姿勢推定はクライアント側で処理されます。  
クライアントの性能によって、処理速度に差異が生じると考えられるので、いくつかの端末で性能比較をしました。

## アプリの起動

## Webアプリ化
posenet_sampleは、index.htmlのローカルファイルをブラウザで開くだけでゲームができるようになっています。  
更に手軽に遊べるように、Webアプリとして起動し、ブラウザでアクセするだけで遊べるように改良します。  

Webアプリのサーバー環境としてDockerを利用します。

注意として、WebブラウザからWebカメラにアクセスするためには、Webアプリはhttpsで配信している必要があるので、  
Dockerイメージビルド時に証明書を作成し、httpsでWebサーバーを起動するようにしています。

```Dockerfile
RUN openssl genrsa -out orekey.pem 1024 && \
    openssl req -new -key orekey.pem -subj "/C=JP/ST=Tokyo-to/L=Shibuya/O=Company Name/OU=IT dept./CN=Company Dept CA" > orekey.csr && \
    openssl x509 -req -in orekey.csr -signkey orekey.pem -out orekey.cert
```

Webサーバー起動時に、作成した証明書を参照するようにします。
```index.js
// 証明書のファイルを指定する
const options = { 
        key: fs.readFileSync('orekey.pem'),
        cert: fs.readFileSync('orekey.cert')
      };

var server = https.createServer(options,app);
```

```bash
model.summary()
```
## 操作インタフェースの追加

ゲーム開始機能  
リトライ機能

## 効果音の追加

取得時に効果音が流れるように

## 落ちてくるものをお菓子に変更

ボールからお菓子に

## 実行結果比較

ラズパイ　jetson GPD Pocket で比較

## さいごに
