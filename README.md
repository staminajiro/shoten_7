技術書典7
====

技術書典7用リポジトリです。

## 執筆方法
#### 案
+ Re::view
+ markdown(md2review)
+ tex
+ word

## テーマ
「新しいんだけどどこか懐かしい、最新デバイスを活用した未来の遊び」

## Ajenda案
 1. obnizとLEDテープで作るルーレットゲーム
 2. obnizで作るモバイルオーダーアプリ
 3. Jetsonで作る一人じゃんけんゲーム
 4. お気に入りの写真を好きな画家の画風に変換!
 5. カメラの中でいくつとれるかな？ゲーム

## re:view

```
cd doc

docker pull nuitsjp/md2review:latest
docker pull vvakame/review:latest
sudo sh ./pdf.sh
```