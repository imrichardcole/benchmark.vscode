cmake_minimum_required(VERSION 3.20)

project(benchmark)

set(benchmark_DIR "C:/sandbox/work/oss/benchmark/benchmark/install/v143_Release/lib/cmake/benchmark")
find_package(benchmark
    CONFIG
    REQUIRED
)

add_executable(benchmark_sample main.cpp)
target_link_libraries(benchmark_sample benchmark::benchmark)

add_executable(benchmark_string_validation main.cpp)
target_link_libraries(benchmark_string_validation benchmark::benchmark)

add_executable(benchmark_heavy_maths main.cpp)
target_link_libraries(benchmark_heavy_maths benchmark::benchmark)

add_executable(benchmark_stress main.cpp)
target_link_libraries(benchmark_stress benchmark::benchmark)