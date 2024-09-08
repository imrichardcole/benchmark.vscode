import * as vscode from 'vscode';
import { exec } from 'child_process';
import { stdout } from 'process';

export function activate(context: vscode.ExtensionContext) {

	const paths = [
		"C:/sandbox/work/vscode/benchmark.vscode/benchmark/build/Release/benchmark_heavy_math.exe",
		"C:/sandbox/work/vscode/benchmark.vscode/benchmark/build/Release/benchmark_sample.exe",
		"C:/sandbox/work/vscode/benchmark.vscode/benchmark/build/Release/benchmark_stress.exe",
		"C:/sandbox/work/vscode/benchmark.vscode/benchmark/build/Release/benchmark_string_validation.exe",
	];

	const provider = new BenchmarkDataProvider(paths);

	vscode.commands.registerCommand('benchmark-vscode.runBinary', () => {
		console.log("binary command has been run");
	});

	vscode.commands.registerCommand('benchmark-vscode.runTreeCommand', (path) => {
		console.log("this would run " + path);
		const { spawn } = require('node:child_process');
		const benchmark_binary = spawn(path, ["--benchmark_format=json"]);

		var scriptOutput = "";
		benchmark_binary.on('exit', function (code: any) {
			console.log("process exited with code - " + code);
			try {
				const output_json = JSON.parse(scriptOutput.toString());
				vscode.window.showInformationMessage("Benchmark: finished running " + path);
			} catch (e: any) {
				const result = e.message;
				vscode.window.showErrorMessage("Benchmark: issue running " + path);
			}
		});
		benchmark_binary.stdout.on('data', (data: any) => {
			scriptOutput += data;
		});

	});

	vscode.window.registerTreeDataProvider('benchmarks-data', provider);
	vscode.commands.registerCommand('benchmark-vscode.refresh', () => {
		console.log("refresh command has been run");
		provider.refresh();
	});
}

class BenchmarkDataProvider implements vscode.TreeDataProvider<BenchmarkBinary> {

	private _onDidChangeTreeData: vscode.EventEmitter<BenchmarkBinary | undefined | null | void> = new vscode.EventEmitter<BenchmarkBinary | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<BenchmarkBinary | undefined | null | void> = this._onDidChangeTreeData.event;

	binaries: BenchmarkBinary[] = [];

	constructor(paths: string[]) {
		paths.forEach((path: string) => {
			this.binaries.push(new BenchmarkBinary(path));
		});
	}

	addData(element: any) {
		//const benchmark = new BenchmarkItem(element);
		//this.data.push(benchmark);
		//this.onDidChangeTreeData;
	}

	getTreeItem(element: BenchmarkBinary): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: BenchmarkBinary|undefined): vscode.ProviderResult<BenchmarkBinary[]> {
		if (element === undefined) {
			return this.binaries;
		}
		return[];
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

}

class BenchmarkBinary extends vscode.TreeItem {

	binary;
	runs: BenchmarkItem[];
	command: vscode.Command;

	constructor(binary: string) {
		super(binary);
		this.binary = binary;
		this.runs = [];
		this.command = {
			command: "benchmark-vscode.runTreeCommand",
			arguments: [binary],
			title: ""
		};
		this.iconPath = "../images/icon.png";
	}

	addRun(details: any) {

	}

}

class BenchmarkItem extends vscode.TreeItem {

	name;

	constructor(details: any) {
		super(details.name);
		this.name = details.name;
		this.iconPath = vscode.ThemeIcon.File;
	}

}

export function deactivate() { }
