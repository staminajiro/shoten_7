# マウス、キーボード、hdmi、電源を接続して起動
# この時点でethernetを接続し、起動しない事象有り -> 電源不足説かも
# AC電源 & wifiドングル -> ネットワーク接続時に落ちる
# AC電源 & wifiドングル & カメラ無し -> ネットワーク接続時に落ちる
# USB電源 > 2A & wifiドングル & カメラ無し -> 起動

mkdir workspace
git clone https://github.com/staminajiro/shoten_7

sudo apt update
sodu apt install -y curl nano

# make tmp
mkdir tmp

# extend swap
cd ~/workspace/tmp
git clone https://github.com/JetsonHacksNano/installSwapfile
cd installSwapfile
./installSwapfile.sh


# install tensorflow
cd ~/workspace/tmp
cd jetson-nano-tools
./install-tensorflow.sh

# install pytouch
cd ~/workspace/tmp
wget https://nvidia.box.com/shared/static/veo87trfaawj5pfwuqvhl6mzc5b55fbj.whl -O torch-1.1.0a0+b457266-cp36-cp36m-linux_aarch64.whl
pip3 install numpy torch-1.1.0a0+b457266-cp36-cp36m-linux_aarch64.whl
