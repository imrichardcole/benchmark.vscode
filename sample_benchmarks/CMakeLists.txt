cmake_minimum_required(VERSION 3.20)

project(benchmark)

find_package(benchmark
    CONFIG
    REQUIRED
)

add_executable(benchmark_sample benchmark_sample.cpp)
target_link_libraries(benchmark_sample benchmark::benchmark benchmark::benchmark_main)

add_executable(benchmark_strings benchmark_strings.cpp)
target_link_libraries(benchmark_strings benchmark::benchmark benchmark::benchmark_main)

add_executable(benchmark_heavy_maths benchmark_heavy_maths.cpp)
target_link_libraries(benchmark_heavy_maths benchmark::benchmark benchmark::benchmark_main)

add_executable(benchmark_stress benchmark_stress.cpp)
target_link_libraries(benchmark_stress benchmark::benchmark benchmark::benchmark_main)