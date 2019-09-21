sudo apt install -y cmake
cd workspace
git clone https://github.com/dusty-nv/jetson-inference.git
cd jetson-inference/
git submodule update --init

mkdir build
cd build
cmake ../
make
sudo make install

cd aarch64/bin
eog orange_0.jpg
./imagenet-console orange_0.jpg output_0.jpg
