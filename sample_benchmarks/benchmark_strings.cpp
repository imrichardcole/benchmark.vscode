#include <iostream>
#include <string>
#include <benchmark/benchmark.h>

static void substring(benchmark::State& state) {
  std::string text = "Now is the time for all good men, to come to the aid of their party....";
  for (auto _ : state) {
    text.substr(4, 17);
  }
}

BENCHMARK(substring);