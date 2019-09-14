# Jetson Nanoでリアルタイム画風変換

突然ですが、皆さんはStyle Transferという技術を知っていますか？

Style Transferとは、ディープラーニングを使った画像処理技術の一つで、画像の内容（コンテンツ）を保持したまま雰囲気（スタイル）のみを変換する技術です。
この技術を使うと、以下のようなムンク風の顔写真や浮世絵風の風景写真などを簡単に作ることができます。

![###scale=0.7###](../images/chapter05_celeba_munch.jpg)
![###scale=0.7###](../images/chapter05_landscape_hokusai.jpg)
    
Style Transfer自体は比較的有名な技術なので、多くの文献やプログラムが公開されていますが、論文にあるようなモデルをJetsonやラズパイなどのデバイス上にそのまま実装した場合、メモリ不足で実行できなかったり動作がカクカクになってしまうことがあります。

そこで今回は、以下の軽量型のモデルを使用して、Jetson Nano上でStyle Transferをリアルタイムに動かしてみたいと思います。  

・Creating a 17 KB style transfer model with layer pruning and quantization (https://heartbeat.fritz.ai/creating-a-17kb-style-transfer-model-with-layer-pruning-and-quantization-864d7cc53693)

本手法のポイントは、Pruning（枝刈り）とQuantization（量子化）というテクニックを使用してパラメーターの数やサイズを減らすことで、モデルを軽くしているという点です。

ありがたいことに、既にからあげさんという方がGitHub上のプログラムを使って同じようなことを試していたため、今回はこちらを参考にさせていただきます。  
・ディープラーニングで軽量のスタイル変換を手軽に楽しむ方法  
 (https://karaage.hatenadiary.jp/entry/2019/08/02/073000:title)  
・Fritz Style Transfer  
 (https://github.com/fritzlabs/fritz-models/tree/master/style_transfer:title)  

上記はとても分かりやすく、記事の内容やプログラムのREADMEに沿って進めていけば特に問題なくやりたいことを実現できるのですが、そのまま実行しただけではつまらないので以下の改良を行ってみます。  
・TensorFlow Lite、量子化を使用したモデルの軽量化  
・複数のスタイルを混合した変換モデルの作成  

まずは、記事と同じ方法でJetson Nano上でStyle Transferが動かせることを確認し、その後上記の改良に挑戦していきたいと思います。


## Style Transferの仕組み

Jetsonでの実装に入る前に、そもそもStyle Transferがどのような原理で実現されているのかを簡単に説明します。
「理論はいいから、とにかく動くものを作りたい！」という方は、本節を飛ばしていただいても構いません。

Style Transferの実現方法やネットワーク構造については様々な方法が提案されていますが、特に有名なのは 以下のJohnsonらの手法です。  
![画像は"Perceptual Losses for Real-Time Style Transfer and Super-Resolution"より###scale=0.8###](../images/chapter05_johnson.jpg)

上記の手法では、入力画像xをスタイル変換用のConv-Deconvネットワークfwに通すことで、変換画像y^を生成します。
モデルの学習では、複数の入力画像xに対して、その生成画像y^と変換対象のスタイル画像ysおよび元のコンテンツ画像ycを学習済みの損失計算用ネットワーク（VGG-16）に入力し、特定の層の出力を取得します。
こうすることで、各画像のスタイルとコンテンツの特徴量をそれぞれ抽出することができるので、生成画像y^と正解画像ys, ycのスタイル、コンテンツの差異がどちらも小さくなるように、変換ネットワークfwのパラメーターを更新していきます。
このようにして、あらかじめ特定のスタイル画像に対する変換ネットワークのパラメーターを学習しておくことで、どのようなコンテンツ画像に対してもfeed-forward処理のみでスタイル変換することができるようになるわけです。
今回使用するモデルも、ネットワークのサイズやBatch Normalizationの有無などの細かい違いはありますが、基本的な構造は上記のモデルとほぼ同じです。

ところで、一般的にディープラーニングのモデルはパラメーター数が膨大なことで知られています。
Style Transferのモデルも例外ではなく、Johnsonらのネットワークではモデルのファイルサイズが約7MBになります。
そのため、モデルの学習はもちろんのこと、推論についてもデバイス上で動かすには少し重くなってしまうという問題があります。

しかし研究によって、ネットワークのパラメーターは全てが必要というわけではなく、大部分は無くても結果に影響しないということが分かっています。
そこで、モデルのパラメーターをギリギリまで減らすことで、変換画像の質を保ったまま、デバイス上でもサクサク動くような軽量なモデルを作ることができると考えられます。
今回のモデルでは、Pruning（枝刈り）とQuantization（量子化）という2つの方法でこれを実現しています。

枝刈りとは、名前の通り畳み込みネットワークの重み（カーネル）の一部を刈り取ることで、パラメーターを減らす手法です。
具体的には、width multiplierと呼ばれる一定の係数（0~1）を各層のフィルター数にかけることで、全体のサイズを小さくしています。

一方、量子化はパラメーターの表現形式を変えることで、モデルを軽くする手法です。
例えば、32bit浮動小数点の形式で表されたパラメーターを8bit整数型に変換することで、サイズを4分の1にすることができます。
この量子化のテクニックは、TensorFlow Mobile, TensorFlow Lite, Core ML, Caffe2Goなどの様々な機械学習フレームワークで採用されています。


## Jetsonの環境構築
ここからは、実際にJetsonでStyle Transferを動かすための方法を説明していきます。

初めに、プログラムを動かすために必要なライブラリやソースコードをJetson Nanoにインストールします。
Jetson NanoにはWi-FIモジュールが付いていないため、有線LANでインターネットに接続する必要があります。

インターネットに接続したら、からあげさんの記事にあるように以下のコマンドを順に実行することで、必要なライブラリ（TensorFlow, Keras, keras-contrib）をインストールすることができます。

```
$ git clone https://github.com/karaage0703/jetson-nano-tools  
$ cd jetson-nano-tools  
$ ./install-tensorflow.sh  
$ sudo apt install libatlas-base-dev gfortran  
$ pip3 install -U cython  
$ pip3 install keras  
$ pip3 install git+https://www.github.com/keras-team/keras-contrib.git  
```

スタイル変換には、Fritzと呼ばれるモデルを使います。
Fritzとは、iOSやAndroidなどのモバイル端末で機械学習アプリを開発するためのプラットフォームです。
FritzにはStyle Transfer用のモデルが既に用意されているため、そちらを使用することで一からプログラムを実装する必要なく、スタイル変換を行うことができるわけです。

プログラムのソースコードも、GitからCloneすることができます。

```
$ git clone https://github.com/karaage0703/fritz-models  
$ cd fritz-models  
$ git checkout jetson_nano  
```

ここで一つ注意点として、上記のリポジトリはデフォルトではJetson Nano用のソースコードにはなっていないため、作業ブランチをmasterからjetson nanoに切り替える必要があります。

モデルの準備が完了したら、Jetsonにカメラを接続します。
カメラの種類や性能は特に問いませんが、今回は手元にあったロジクールのウェブカメラ（C270N HD WEBCAM）を使いました。
USBケーブルをJetson Nanoに挿すだけで、簡単にカメラと接続することができます。


## Jetsonでのスタイル変換

上記のGitHubリポジトリには学習済みのモデルが公開されているため、そちらを使って手軽にスタイル変換を試すことができます。
学習済みモデルでは、ゴッホの星月夜の画像をスタイル画像として使っています。
![###scale=0.5###](../images/chapter05_gogh.jpg)

入力画像のサイズやファイル形式に応じて複数のモデルが用意されており、今回は256x256のKeras用モデル（starry_night_256x256_025.h5）を使用します。
モデルファイル名の「025」は、先ほど説明したネットワークの枝刈りの割合がα=0.25であることを表しています。

fritz-modelsのディレクトリで以下のコマンドを実行することで、モデルを動かすことができます。

```
$ cd style_transfer  
$ python3 stylize_movie.py \
 --model-checkpoint='example/starry_night_256x256_025.h5'  \
 -d='jetson_nano_raspi_cam'  
```

このとき、学習済みモデルの読み込みがうまくいかず、以下のようなエラーが発生することがあります。

```
OSError: Unable to open file (file signature not found)
```

どうやら、Git Cloneでモデルファイルをダウンロードするとファイルが欠損することがあるようで、自分の場合はリポジトリから対象ファイルを「Download」ボタンで別途ダウンロードすることで、正常に読み込めるようになりました。

プログラムを実行すると、ゴッホ風にスタイル変換されたカメラ画像が画面上にリアルタイムに表示されます。
![###scale=0.5###](../images/chapter05_face_gogh.jpg)


## 変換モデルの学習

ここまでの手順で、公開されている学習済みモデルを使用して、Jetson上でスタイル変換を行うことができました。

しかし、せっかくなら自分の好きな画家やアニメなどのスタイルに画像を変換できた方が、より楽しいと思います。
そこで次は独自に用意した画像を使って、スタイル変換のモデルを学習する方法を説明します。

モデルの学習は、クラウド上の仮装マシンや業務用の分析サーバー、個人用のノートPCなど、どこでも実行することができますが、学習を高速に行うためにはGPUを使用できる環境が望ましいです。
自分のPC環境では、ネットワークの通信速度の問題で学習用のCOCOデータをダウンロードできなかったため、Google Colab上で学習を行うこととしました。

先ほどのGithubリポジトリにモデル学習用のJupyter Notebookが公開されているため、そちらを使用します。

学習の詳細な手順については、ノートブックにコメントがついているので割愛させていただきますが、大まかな流れは以下のようになります。

1. 必要なモジュール、ソースコードのインストール
2. スタイル画像の選択
3. 学習データの準備
4. モデルの学習
5. スタイル変換のテスト
6. モデルの変換（任意）

ノートブックのコードをそのまま使う場合、1つのモデルに対してスタイル画像は1枚しか指定することはできません（後ほど、複数のスタイルを混合する方法を説明します）。

モデルの学習では、先ほど使用した星月夜の学習済みモデルを使って、Fine-Tuningを行います。
このとき特に重要なパラメーターがalphaで、上記で説明したパラメーターの枝刈りの割合を表しています。
デフォルトは0.25となっており、全体の4分の1のパラメーターが削減されることになります。
モデルを一から学習する場合はalphaを任意の値に変更することができますが、今回はFine-Tuningの基となる星月夜のモデルとネットワーク構造を合わせる必要があるため、alpha=0.25に固定する必要があります。

モデルの学習が完了すると、任意の入力画像に対してスタイル変換を行なった結果をGoogle Colab上で確認することができます。

モデルのパラメーターは、Keras用のファイル形式（my_style_025.h5）で保存されています。
Jetson Nano上で動かしたい場合は、Google Colabからローカルマシンにモデルファイルをダウンロードして、Jetsonからアクセス可能な場所に移動します。


## モデルの軽量化

上記のKeras用モデルをそのまま使っても、Jetson Nano上でStyle Transferを動かすことはできますが、ここではTensorFlow Liteを使ってモデルをさらに軽量化したいと思います。
TensorFlow Liteとは、TensorFlowの学習済みモデルを推論用に特化させることで、モバイル端末などのデバイス上で実行できるようにするライブラリです。
その際に、量子化によってパラメーターの型を変換することで、モデルサイズを小さくすることができます。

Fritzモデルにも、Keras用のモデルをTensorFlow Lite用に変換するスクリプト（convert_to_tflite.py）が用意されていますが、このスクリプトでは量子化を行なっていないため、量子化するようにソースコードを変更します。
実装は非常に簡単で、コンバーターの定義後に最適化の変数を配列形式で指定するだけです。

```
# コンバーターの定義
converter = tf.lite.TFLiteConverter.from_frozen_graph(
    frozen_graph_filename,
    input_arrays=['input_1'],
    output_arrays=['deprocess_stylized_image_1/mul'],
    input_shapes={'input_1': [1, image_size[0], image_size[1], 3]}
    )

# 量子化の設定
converter.optimizations = [tf.lite.Optimize.OPTIMIZE_FOR_SIZE]
```

最適化の方法には、上記の重み量子化（OPTIMIZE_FOR_SIZE）以外にも、完全整数型（DEFAULT）や16bit浮動小数点型（FLOAT16）などがあり、軽量化の度合いやモデルの性能などの要件に応じて選ぶことができます。
また、この量子化はバージョン1.14.0以降のTensorFlowにしか対応していないので、古いバージョンで使用したい場合はご注意ください。

変更後のスクリプトをGoogle ColabやJetson上で実行すると、TensorFlow Lite用のモデル（my_style_025.tfilite）が生成されます。
若干ではありますが、元のKeras用のモデルと比較してファイルサイズが小さくなったことが確認できました（570KB -> 479KB）。

モデルの変換が完了したら、いよいよJetson Nanoでスタイル変換を行います。
推論用のプログラム（stylize_movie.py）はKeras用になっているので、こちらもTensorFlow Lite用に変更する必要があります。
推論を行う箇所を抜粋すると、以下のようになります。

```
# TensorFlowをインポート
import tensorflow as tf

# Interpreterを準備
interpreter = tf.lite.Interpreter(model_path=args.model_checkpoint)
interpreter.allocate_tensors()

# 入力、画像サイズ、出力を定義
inputs = interpreter.get_input_details()
image_size = inputs[0]['shape']   
outputs = interpreter.get_output_details()

# 入力画像を読み込む
input_image = utils.load_image(
    args.input_image,
    image_size[1],
    image_size[2],
    expand_dims=True
    )
input_image = np.array(input_image, dtype=np.float32)
    
# 推論を実行
interpreter.set_tensor(inputs[0]['index'], input_image)
interpreter.invoke()

# 出力画像を取得
output_image = interpreter.get_tensor(outputs[0]['index'])
```

星月夜のときと同様に、以下のコマンドを実行すると、リアルタイムでスタイル変換が行われます。

```
$ python3 stylize_movie_tflite.py --model-checkpoint='{モデルファイルのディレクトリ}/my_style.tflite' -d='jetson_nano_raspi_cam'  
```

## 複数スタイルの合成

最後に、複数のスタイルを混合したStyle Transferを実現する方法を紹介します。
これができれば、例えばゴッホとモネの画風を合わせた写真などを、自由に作ることができるようになります。

複数スタイルの合成については、以下の論文が大変参考になります。  
Multi Style Transfer: 複数のスタイルの任意重み合成によるモバイル上でのリアルタイム画風変換 (https://db-event.jpn.org/deim2017/papers/278.pdf)

今回使用するFritzモデルでは、複数のスタイル画像を入力として与えると、単純に1対1の割合でそれらを混合して学習を行うようだったので、元のプログラムをそのまま使用しています。
スタイルを任意の重みや形式で合成するなど、より発展的な内容に興味のある方は、上記の論文などを参考に自力で実装してみてください。
（実は、自分も今回重み付きのスタイル合成に挑戦したのですが、Kerasの実装がうまくいかずに断念しました）

複数のスタイル画像を使用する場合の学習コマンドは、以下のようになります。

```
!cd fritz-models/style_transfer/ && export PYTHONPATH=`pwd` \
 && python style_transfer/train.py \
--training-image-dset data/training_images.tfrecord \
--style-images "data/style_image_1.jpg,data/style_image_2.jpg" \
--model-checkpoint data/my_style_025.h5 \
--image-size 256,256 \
--alpha 0.25 \
--num-iterations 500 \
--batch-size 2 \
--style-weight 0.00001 \
--fine-tune-checkpoint example/starry_night_256x256_025.h5
```

基本的にはスタイル画像が1つの場合と同じですが、プログラムの引数が若干異なっています。
まず、style-imagesに使用したいスタイル画像をカンマ区切りで複数指定します。このとき、カンマの後ろにスペースがあるとエラーとなってしまうので注意してください。
また、スタイル画像1つの場合はバッチサイズを32としていましたが、複数スタイルの場合はネットワークに入力するコンテンツ画像とスタイル画像のデータ数が同じになっている必要があるようで、batch-sizeをスタイル画像と同じ枚数に指定しています。

モデルの学習以降の流れは、スタイル画像1枚の場合と全く同じです。
本当はサークルイメージ（？）である、すたみな太郎の画像とラーメン二郎の画像を合成したかったのですが、すたみな太郎のロゴ画像はライセンスの関係で使えなさそうだったので、今回はムンクと浮世絵の画像を合成してみます。

生成された画像は、以下のようになりました。
![###scale=0.7###](../images/chapter05_landscape_munch_hokusai.jpg)

あまり綺麗に変換できませんでしたが、なんとなくムンクのおどろおどろしさと浮世絵の力強さが合わさっているような気がします。

## まとめ
本章では、軽量型のモデルを使ってJetson NanoでStyle Transferを動かす方法を紹介しました。
また、TensorFlow Liteや量子化を使ってモデルを軽量化したり、複数のスタイルを合成した画像を生成してみました。

Style Transferは既にスマートフォンアプリなどに使われていますが、今回のようにIoTの技術と組み合わせたりすることで、様々なサービスに応用できると思われます。
またディープラーニングによるスタイル変換技術は、単なる画風変換以外にも動画制作や音声合成など、他の分野でも今後活用が進んでいくのではないでしょうか。

皆さんも是非、Style Transferを使って色々な面白いサービスを作ってみてください！

(KazukiYazawa)