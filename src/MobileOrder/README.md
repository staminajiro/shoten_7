# MobileOrder

obnizと接続して遊ぶモバイルオーダーアプリです。

# 必要なもの
+ obniz Board
+ led(初期状態だと7つ必要です。)  
+ obniz Boardとledをつなぐジャンパケーブル
# セットアップ
./js/app.jsの23行目にご自身のobniz BoardのIDを指定してください。
```javascript
var io = this.selected.io;
var obnizid = "xxxx-xxxx";  
```

