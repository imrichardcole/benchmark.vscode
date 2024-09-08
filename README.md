# benchmark-vscode README

A vscode extension for running and exploring benchmarks written with Google's benchmark library

Building examples included with this project
---

This project includes a set of simple benchmarks to use with the extension.  To build them:

    cd sample_benchmarks
    cmake -S . -B build
    cmake --build build --config Release

N.B this assumes that benchmark is built and available.
