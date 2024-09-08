#include <iostream>

#include <benchmark/benchmark.h>

static void BM_A(benchmark::State& state) {    
  for (auto _ : state) {
    double x = 3.14 * 3.14;
  }
}

static void BM_B(benchmark::State& state) {
  for (auto _ : state) {
    double x = 3.14 * 3.14;
  }
}

static void BM_C(benchmark::State& state) {
  for (auto _ : state) {
    double x = 3.14 * 3.14;
  }
}

BENCHMARK(BM_A);
BENCHMARK(BM_B);
BENCHMARK(BM_C);