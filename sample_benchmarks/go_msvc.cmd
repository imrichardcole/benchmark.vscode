
cd benchmark_src
rm -rf build install
cmake -S . -B build -DCMAKE_INSTALL_PREFIX=install -DBENCHMARK_ENABLE_TESTING=FALSE
cmake --build build --config Release -j4 --target install
cd ..

rm -rf build install
cmake -S . -B build -DCMAKE_INSTALL_PREFIX=install
cmake --build build --config Release -j4