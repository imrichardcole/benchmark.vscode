#include <iostream>

#include <benchmark/benchmark.h>

static void do_some_sums(benchmark::State& state) {
    std::vector<double> numbers;
    for (auto _ : state) {
        for(int i = 0; i < 10000; i++)
        {
            double x = 3.14 * i;
            numbers.push_back(x);
        }
    }
}

static void do_some_more_sums(benchmark::State& state) {
    std::vector<double> numbers;
    for (auto _ : state) {
        for(int i = 0; i < 250000; i++)
        {
            double x = 3.14 * i * 2.7839832;
            numbers.push_back(x);
        }
    }
}

BENCHMARK(do_some_sums);
BENCHMARK(do_some_more_sums);