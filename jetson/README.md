jetson セットアップ用
====

## パーツ
+ wifi: WLI-UC-GNM2S(2019/0901 ドライバビルド無しで接続確認)

## セットアップ
+ からあげさん記事参照(https://qiita.com/karaage0703/items/b09f3c65eb3913d087e4)
+ [jupyter等](https://medium.com/@heldenkombinat/getting-started-with-the-jetson-nano-37af65a07aab)


## jupyter
```
ssh -L 8888:localhost:8888 jetson@jetson.local
cd {your work dir}
jupyter notebook --ip='*' --NotebookApp.token='' --NotebookApp.password=''
```

## gpu monitoring

```
sudo -H pip3 install jetson-stats
sodu jtop
```

## SDカードコピー(for mac)
+ http://make.bcde.jp/raspberry-pi/sdカードの複製for-mac/


```
df # check sd name
src_sd={src sd name}
image_name={image name}

diskutil umountDisk /dev/${src_sd}
sudo dd if=/dev/$src_sd of=${image_name}.dmg bs=1m
```