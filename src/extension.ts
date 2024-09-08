import { stat } from 'fs';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let elements: BenchmarkBinary[] = [];

	if(vscode.workspace.workspaceFolders !== undefined)
	{
		let benchmark_directory_config = vscode.workspace.getConfiguration('benchmark').get('binaries-directory', "build/Release");
		let workspace_folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		let benchmark_directory = workspace_folder + "/" + benchmark_directory_config;
		
		const fs = require('fs');
		let files = fs.readdirSync(benchmark_directory);
		files.forEach((file: any) => {
			let full_benchmark_path = benchmark_directory + "/" + file;
			if(full_benchmark_path.endsWith(".exe")) {
				elements.push(new BenchmarkBinary(file, full_benchmark_path));
			}
		});
		if(elements.length === 0) {
			vscode.window.showErrorMessage("Benchmark: no executables found in " + benchmark_directory);
		}
		vscode.window.showInformationMessage("Benchmark: found " + elements.length + " benchmarks");
	}

	const provider = new BenchmarkDataProvider(elements);

	function format_iterations(iterations: string) {
		return iterations.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	vscode.commands.registerCommand('benchmark-vscode.runBenchmark', (benchmark) => {
		const { spawn } = require('node:child_process');
		const benchmark_binary = spawn(benchmark.full_path, ["--benchmark_format=json", "--benchmark_filter=" + benchmark.label]);
		var scriptOutput = "";
		benchmark_binary.on('exit', function (code: any) {
			try {
				const output_json = JSON.parse(scriptOutput.toString());
				output_json["benchmarks"].forEach((element: { [x: string]: string; }) => {
					let real_time = Math.round(parseFloat(element["real_time"]));
					let iterations = format_iterations(element["iterations"]);
					let time_unit = element["time_unit"];
					benchmark.addResult(real_time, time_unit, iterations);
				});
				vscode.window.showInformationMessage("Benchmark: finished running benchmark " + benchmark.label);
				provider.refresh();
			} catch (e: any) {
				const result = e.message;
				vscode.window.showErrorMessage("Benchmark: issue running benchmark "+ benchmark.label);
			}
		});
		benchmark_binary.stdout.on('data', (data: any) => {
			scriptOutput += data;
		});
		benchmark_binary.on('error', (error: any) => {
			vscode.window.showErrorMessage(`Benchmark: error running benchmark - ${error}`);
		});
	});

	vscode.commands.registerCommand('benchmark-vscode.runBenchmarkBinary', (benchmarkBinary) => {
		const { spawn } = require('node:child_process');
		const benchmark_binary = spawn(benchmarkBinary.full_path, ["--benchmark_format=json"]);
		var scriptOutput = "";
		benchmark_binary.on('exit', function (code: any) {
			try {
				const output_json = JSON.parse(scriptOutput.toString());
				output_json["benchmarks"].forEach((element: { [x: string]: string; }) => {
					let real_time = Math.round(parseFloat(element["real_time"]));
					let iterations = format_iterations(element["iterations"]);
					let time_unit = element["time_unit"];
					let benchmark = benchmarkBinary.addBenchmark(element["name"]);
					benchmark.addResult(real_time, time_unit, iterations);
				});
				vscode.window.showInformationMessage("Benchmark: finished running benchmark " + benchmarkBinary.name);
				provider.refresh();
			} catch (e: any) {
				const result = e.message;
				vscode.window.showErrorMessage("Benchmark: issue running benchmark "+ benchmarkBinary.name);
			}
		});
		benchmark_binary.stdout.on('data', (data: any) => {
			scriptOutput += data;
		});
		benchmark_binary.on('error', (error: any) => {
			vscode.window.showErrorMessage(`Benchmark: error running benchmark - ${error}`);
		});
	});

	vscode.window.registerTreeDataProvider("benchmarks", provider);
}

export function deactivate() { }

class BenchmarkDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

	elements: vscode.TreeItem[];

	constructor(elements: vscode.TreeItem[]) {
		this.elements = elements;
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
		if (element === undefined) {
			return this.elements;
		}
		if(element instanceof BenchmarkBinary) {
			return Array.from(element.benchmark_map.values());
		}
		if(element instanceof Benchmark) {
			return element.results;
		}
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

}

class BenchmarkBinary extends vscode.TreeItem {

	name: string;
	full_path: string;
	benchmark_map = new Map<string, Benchmark>();
	run_counter: number = 0;
	has_run: boolean = false;

	constructor(name: string, full_path: string) {
		super(name);
		this.full_path = full_path;
		this.iconPath = new vscode.ThemeIcon('testing-run-all-icon');
		this.name = name;
		this.contextValue = 'benchmarkbinary';
	}

	addBenchmark(name: string) {
		this.has_run = true;
		this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		if(this.benchmark_map.get(name) === undefined) {
			let benchmark = new Benchmark(name, this.full_path);
			this.benchmark_map.set(name, benchmark);
			return benchmark;
		} else {
			return this.benchmark_map.get(name);
		}
	}
}

class Benchmark extends vscode.TreeItem {
	
	results: BenchmarkResult[] = [];
	full_path: string;
	constructor(name: string, full_path: string) {
		super(name);
		this.contextValue = 'benchmark';
		this.full_path = full_path;
	}

	addResult(real_time: number, time_unit: string, iterations: number) {
		let result = new BenchmarkResult(real_time, time_unit, iterations);
		this.results.push(result);
		this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
	}
}

class BenchmarkResult extends vscode.TreeItem {
	
	constructor(real_time: number, time_unit: string, iterations: number) {
		super(new Date().toLocaleDateString() + ". " + real_time + time_unit + " - " + iterations + " iterations");
		this.iconPath = new vscode.ThemeIcon('testing-passed-icon');
	}
	contextValue = 'benchmark.extension.benchmark.result';
}