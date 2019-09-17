# カメラの中でいくつとれるかな？ゲーム
## はじめに  
カメラの中でいくつとれるかな？ゲームは、WebカメラとWebブラウザだけで手軽に遊べるジェスチャゲームです。  
落ちてくるボールを手でキャッチすると得点が得られます。  

このゲームのベースとなっているプログラム(https://github.com/gnavi-blog/posenet_sample)の詳細は、  
[ぐるなびさんのテックブログ](https://developers.gnavi.co.jp/entry/posenet/hasegawa)で紹介されています。

posenet_sampleに以下のような機能を追加し、より遊びやすく・楽しいものに仕上げました。

- Webアプリ化
- 操作インタフェースの追加
- 効果音の追加

本書では、追加した機能について簡単に紹介します。  

また、このゲームは、Googleが開発している姿勢推定のJSライブラリ「PoseNet」を利用しているため、  
姿勢推定はクライアント側で処理されます。  
クライアントの性能によって、処理速度に差異が生じると考えられるので、いくつかの端末で性能比較をしました。

## アプリの起動
以下のコマンドを実行してください。

```
git clone git@github.com:staminajiro/shoten_7.git

cd shoten_7/src/GestureGame

docker build ./ -t gesturegame

docker run -p 8080:8080 gesturegame
```

無事起動できたら、(https://localhost:8080)にアクセスします。

以下の画面のように、プライバシーエラーが表示されたら、  
「詳細設定」→「localhostにアクセスする」をクリックしてください。

![プライバシーエラー###scale=0.5###](../images/chap02_privacyerror.png)

その後、カメラの使用を許可してください。

![カメラを許可###scale=0.5###](../images/chap02_camera.png)

以下のような画面が表示されれば成功です。
![起動画面###scale=0.5###](../images/chap02_gametop.png)

右手、もしくは左手を画面中央のゲーム開始部分に持ってくると、
ゲームが開始します。

## Webアプリ化
posenet_sampleは、index.htmlのローカルファイルをブラウザで開くだけでゲームができるようになっています。  
更に手軽に遊べるように、Webアプリとして起動し、ブラウザでアクセするだけで遊べるように改良します。  

Webアプリのサーバー環境としてDockerを利用します。

注意として、WebブラウザからWebカメラにアクセスするためには、Webアプリはhttpsで配信している必要があるので、  
Dockerイメージビルド時に証明書を作成し、httpsでWebサーバーを起動するようにしています。

```Dockerfile
RUN openssl genrsa -out orekey.pem 1024 && \
    openssl req -new -key orekey.pem -subj \
    "/C=JP/ST=Tokyo-to/L=Shibuya/O=Company \
    Name/OU=IT dept./CN=Company Dept CA" > \
    orekey.csr && \
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

## 操作インタフェースの追加
恥ずかしがらずに実際遊んでみると、大人でも結構楽しめます。
しかし、posenet_sampleは1回遊ぶと再読み込みが必要なため、
連続して遊べません。
何度でも連続して遊べるように、リトライ機能を追加します。

せっかく姿勢推定ができる状態ですので、マウス操作ではなく
身体を使ってゲームを開始できるようにします。

カメラの映像に姿勢推定の結果を重ね合わせているcanvasに、
「ゲーム開始」ボタンを配置します。
canvasに四角形を描画するfillRect()と文字列を表示するfillText()を使って、
「ゲーム開始」ボタン(のようなもの)を表現します。

```
ctx.fillRect(330,310,150,50);
ctx.font = "bold 20px Arial";
ctx.fillStyle = "blue";
ctx.fillText("ゲーム開始", 350, 345);
ctx.fill();
```

右手、もしくは左手が「ゲーム開始」ボタンと重なっているかどうかを、
PoseNetの姿勢推定の結果の座標と、「ゲーム開始」ボタンの座標を比較して、
判定します。

```
gameRestart([keypoints[9],keypoints[10]]);

function gameRestart(wrists){
    wrists.forEach((wrist) => {
    if((330 - 10)  <= wrist.position.x && \
    wrist.position.x <= (480 + 10) &&
        (310 - 10) <= wrist.position.y && \
         wrist.position.y <= (360+ 10)){
        balls = [];
        balls = initBalls(ballNum);
        score = 0;
        timeLimit = 50;
        printLimit = timeLimit / 10;
    }
    });
}
```

## 効果音の追加
Webアプリ化、操作インタフェースの機能を追加したので、初期に比べて遊びやすくなりました。  
最後に、よりゲームが楽しくなるように、効果音を追加します。  

以下のように、javascriptのAudioオブジェクトを使用して、ボールの位置と手の位置がある程度(今回の例だと50px)一致した場合に、効果音が鳴るように記述します。

効果音は以下のサイトのものを使用させていただきました。  
効果音ラボ(https://soundeffect-lab.info/)
```
let sound = new Audio();
sound.src = "static/sound/suck1.mp3";

~

function ballsDecision(ctx, wrists) {
    for (i = 0; i < ballNum; i++) {
        balls[i].y += 30;
        if (balls[i].y > contentHeight) {
            balls[i] = resetBall();
            return;
        } else {
            wrists.forEach((wrist) => {
                if ((balls[i].x - 50) <= wrist.position.x && wrist.position.x <= (balls[i].x + 50) &&
                    (balls[i].y - 50) <= wrist.position.y && wrist.position.y <= (balls[i].y + 50)) {
                    score += 10;
                    sound.play();
                    balls[i] = resetBall();
                }
            });
            ctx.beginPath();
            ctx.arc(balls[i].x, balls[i].y, 25, 0, 2 * Math.PI);
            ctx.fillStyle = balls[i].color
            ctx.fill();
        }
    }
}
```

## 実行結果比較
これで、ジャスチャーゲームをより遊びやすく・楽しいものにする準備が整いました。  
冒頭でも述べましたが、このジェスチャーゲームは、クライアントの処理性能に依存するので、
小型端末である、Raspberry Pi 3 Model B+(以下ラズパイさん)、jetson nano(以下ジェットソンさん)、GPD Pocket 2 (以下、GPDさん)で実行結果を比較します。

### ラズパイさん
![らずぱい###scale=0.5###](../images/chap02_scp_rasp.png)  
残念ながら、ジェスチャーゲームを起動することはできませんでした。
### ジェットソンさん
![jetson###scale=0.5###](../images/chap02_scp_jetsonnano.png)
快適にゲームをプレイすることができます。
### GPDさん
![GPD###scale=0.5###](../images/chap02_scp_GPD.png)
快適にゲームをプレイすることができます。

現在日本で購入できるラズパイさんの最新モデルでも、スペック不足のようです。  
ラズパイ4さんに期待です。  
NVIDIAのGPUを積んでいるジェットソンさんは流石、というべきか、快適にゲームを楽しめます。  
また、本記事の執筆やプログラムの開発に利用しているGPDさんも、ジェットソンさんに負けないぐらい快適にゲームが楽しめます。
画面もキーボードもついているので、1台あると大活躍です。

## さいごに
javascriptだけで簡単にジェスチャーゲームを作ることができました。
このような身体を使ったゲームは、意外と大人も楽しめます。  
日頃運動できてないなー、という方に楽しんで頂けたらと思います。
スコアが表示されるので、同僚と競い合ってもよいですね。  
まだまだ改良を加えて、もっと楽しいゲームにしていきたいと思います。

(kt-watson)