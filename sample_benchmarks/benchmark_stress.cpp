#include <iostream>

#include <benchmark/benchmark.h>

static void add_loads_of_numbers(benchmark::State& state) {
    std::vector<int> numbers;
    for (auto _ : state) {
        for(int i = 0; i < 10000; i++) {
            numbers.push_back(i * 10);
        }
        int sum = 0;
        for(auto current : numbers)
        {
            sum += current;
        }
    }
}

BENCHMARK(add_loads_of_numbers);