rm -rf build
rm -rf install

cmake -S . -B build -DCMAKE_INSTALL_PREFIX=install
cmake --build build --config Release -j4