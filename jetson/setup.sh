# マウス、キーボード、hdmi、電源を接続して起動
# この時点でethernetを接続し、起動しない事象有り -> 電源不足説かも
# AC電源 & wifiドングル -> ネットワーク接続時に落ちる
# AC電源 & wifiドングル & カメラ無し -> ネットワーク接続時に落ちる
# USB電源 > 2A & wifiドングル & カメラ無し -> 起動

# install utility
mkdir workspace
git clone https://github.com/staminajiro/shoten_7

sudo apt update
sodu apt install -y curl nano

# disable capslock
gsettings set org.gnome.desktop.input-sources xkb-options "['ctrl:nocaps']"
sudo sed -i -e "s/XKBOPTIONS=\"\"/XKBOPTIONS=\"ctrl:nocaps\"/g" /etc/default/keyboard

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

# install other lib
pip3 install jupyter
sudo apt -y install libjpeg-dev libfreetype6-dev pkg-config libpng-dev
pip3 install matplotlib pillow==5.4.1

# install torch vision
# https://roshiago.blog.so-net.ne.jp/2019-05-04
cd ~/workspace/tmp
sudo apt install -y libjpeg-dev zlib1g-dev
git clone -b v0.3.0 https://github.com/pytorch/vision torchvision
cd torchvision
sudo python3 setup.py install
