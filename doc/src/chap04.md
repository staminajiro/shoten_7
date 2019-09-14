# Jetsonで作る一人じゃんけんゲーム

## はじめに
全章ではTensorFlow.jsを用いてブラウザ上でじゃんけんの推論を行いましたが、本章でJetson Nanoというシングルボードコンピューターを用いて、gpuを使ったじゃんけん画像の推論機能を作成する過程を紹介します。

## 目次
+ Jetson Nanoとは
+ Jetson NanoでPyTorchを動かす
+ Google Colaboratoryでじゃんけんモデルの学習
+ Jetson Nanoでじゃんけん画像を推論

## Jetson Nanoとは
Jetson NanoはNVIDIA社が販売しているGPU付きのシングルボードコンピューターです。
cuda等の環境がデフォルトで同梱されているため、tensorflow等のディープラーニングライブラリを比較的簡単にgpu上で動作させることができます。
今回はPyTorchというFacebookが開発したディープラーニングライブラリを用いて、Jetson Nano上で「グー」「チョキ」「パー」の3つの画像を判別していきます。

## Jetson NanoでPyTorchを動かす

まずはJetsonで、PyTorchの環境を構築します。

Jetson Nano, PyTorchともに更新が頻繁にあるので、公式のリポジトリ(https://github.com/pytorch/pytorch)を参照してインストールしてください。（2019/09/01現在では、以下のコマンドでインストール可能でした。）

```
mkdir ~/workspace
mkdir ~/workspace/tmp

# install pytouch
cd ~/workspace/tmp
wget https://nvidia.box.com/shared/static/veo87trfaawj5pfwuqvhl6mzc5b55fbj.whl -O torch-1.1.0a0+b457266-cp36-cp36m-linux_aarch64.whl
pip3 install numpy torch-1.1.0a0+b457266-cp36-cp36m-linux_aarch64.whl

# install torch vision
# https://roshiago.blog.so-net.ne.jp/2019-05-04
cd ~/workspace/tmp
sudo apt install -y libjpeg-dev zlib1g-dev
git clone -b v0.3.0 https://github.com/pytorch/vision torchvision
cd torchvision
sudo python3 setup.py install
```

なお、Jupyter Notebookがあるとリモートから接続して開発しやすくなるので、おすすめです。

```
# install other lib
pip3 install jupyter
sudo apt -y install libjpeg-dev libfreetype6-dev pkg-config libpng-dev
pip3 install matplotlib pillow==5.4.1
```

PyTorchからgpuが利用できるかは、Pythonで以下を実行して確認してください。

```
import torch
torch.cuda.is_available() # -> gpuが使える場合True
```

以上で、Jetson Nano へのPyTorchのインストールは完了です。

## Google Colaboratoryでじゃんけんモデルの学習

今回は画像の学習はJetson Nanoではなく、Google Colaboratory（以下、colabo）というgoogleが提供しているPython実行環境上で行います。colaboは無料で使えるJupyter Notebook環境で、GPUを利用することも可能です。また、PyTorchもデフォルトでインストールされているので、手軽にディープラーニングを試すことができます。

今回は、PyTorchが公開している"Transfer Learning Tutorial(https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)"を参考に、じゃんけん画像判定モデルを構築していきます。

Transfer Learning(転移学習)は、公開されているモデルの構造・パラメータを流用して、簡易に学習を行うことができる手法です。
PyTorchはサブモジュールのtorchvisionを用いることで、簡単に公開されているモデルをダウンロードすることができます。

### 転移学習

今回はresnet50という軽量なモデルを用いて、転移学習を行います。
ディープラーニングでは、多数のニューラルネットが層状に組み合わさったモデルを用います。
このうち、最後の"全結合層"のみを再学習することによって、すでに学習が進んで画像の特徴抽出機能を持った層を転用することができます。

以下は、PyTorchのチュートリアルに注釈をつけたものです。

```
# モデルのロード
model_conv = torchvision.models.resnet18(pretrained=True) 

# パラメータを更新しないように設定
for param in model_conv.parameters():
    param.requires_grad = False

# fc == full conecction == 全結合層の値を取得
num_ftrs = model_conv.fc.in_features

# 新たに全結合層を定義（nn.Linearの第2引数はクラス数） --- (1)
model_conv.fc = nn.Linear(num_ftrs, 2)
```

今回はじゃんけん判別モデルを作成したいため、(1)のクラス数を変更してあげましょう。

```
class_num = 3
model_conv.fc = nn.Linear(num_ftrs, class_num)
```

### データの準備

それでは、学習用のじゃんけんの画像を集めていきましょう。今回はグー、チョキ、パーごとにjpg画像を100枚ぐらいずつ集めてみてください
（手の写真なので、スマートフォンなどで撮影すれば良いかと思います）。

集めた画像については、学習用と検証用に50枚ずつ以下のようなディレクトリ構成で格納してください。

```
train
|    |----goo
|    |----choki
|    |----paa
|
val--
     |----goo
     |----choki
     |----paa
```

データはgoogle driveにアップロードすれば、以下のようにしてcolaboから参照することができます。

```
from google.colab import drive
drive.mount('/content/drive', force_remount=True)
!cp -r {your janken directory} ./
data_dir = "{your data directory}"
```

これで、データの準備はできました。

### 実行、モデルの保存
あとは、notebookどおりに実行していくとモデルが出力できます。この手順だと、上から
+ データロード
+ データアーギュメンテーション（画像の水増し）
+ 訓練用の関数などの定義
+ モデル定義
+ モデルの訓練

となります。

訓練の過程で

```
Epoch 9/24
----------
train Loss: 0.5237 Acc: 0.7938
val Loss: 0.3559 Acc: 0.8603
```

というような表示がでますので、各エポック毎にLoss（損失）が減って、Acc（精度）が増えていれば、学習が正常に行われていることになります。


作成したモデルは、

```
torch.save(model_conv.state_dict(), "{google drive directory}")
```

として、google driveに保存してください。

以上で、モデルの学習は終了です。

### Jetson Nanoでじゃんけん画像を推論

それではJetson Nanoでじゃんけん画像を推論してみましょう。
Jetson上でPyTorchを動かす環境はすでに整っていますので、モデルをgoogle driveからダウンロードします（ここでは、"hanken_model.dat"という名前で保存しました）。

推論用のPythonスクリプトは以下になります。


```predict.py

def init_model(model_path, class_num):
    model_conv = torchvision.models.resnet50()        
    num_ftrs = model_conv.fc.in_features
    model_conv.fc = nn.Linear(num_ftrs, class_num)

    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    print(device)
    model_conv = model_conv.to(device)
    print('start loading')
    model_conv.load_state_dict(torch.load(model_path))
    print('finish loading')
    model_conv.eval()
    return model_conv

def predict_from_imagepath(image_path, class_names):
    image = Image.open(image_path)
    return predict(image, class_names)

def predict(image, class_names):
    data_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])

    image = data_transform(image).unsqueeze(0).cuda()
    print('start predicting')
    out = model_conv(image)
    print('finish predicting', out, out.argmax())
    class_name = class_names[out.argmax()]
    print('Predicted class is: {}'.format(class_name))
    return class_name

if __name__=='__main__':
    class_names = ['choki', 'goo', 'paa']
    class_num = len(class_names)
    model_conv = init_model('./janken_model.dat', class_num)
    predict_from_imagepath('./goo.jpg', class_names)

```

まず、init_model関数では、訓練していないresnet50のモデルをダウンロードし、
colabo上で訓練したデータをロードしています。

GPUが正常に認識されていれば、

```
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
print(device)
```
の箇所で"cuda:0"が出力されるはずです。

また、モデルをロードした痕は

```
model_conv.eval()
```

を行わないとモデルが推論モードにならないので、注意してください。

predict関数では、画像を変換し、モデルを用いて推論を行います。画像変換時のパラメータは、学習の際に評価画像を生成することに用いたパラメータを流用しています。

では、推論用に"goo.jpg"という名前でグーの画像をJetson上に保存し、上記のスクリプトを実行してください。
正しく推論されたでしょうか？ 入力画像を様々に変えて実行してみると、面白いかと思います。

## おわりに
以上で、じゃんけん推論システムの紹介を終わります。今回はじゃんけんを題材に、シングルボードコンピュータでディープラーニングを組み込んだアプリケーションを動かしてみました。筆者が生成したモデルはまだまだ精度が低いので、画像データを増やしたり、モデルを変更したりして、今後も精度を上げていきたいと思います。みなさんも、Jetson Nanoでいろいろと遊んでみてはいかがでしょうか。

(soy-curd)