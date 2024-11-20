import { stat } from 'fs';
import { platform } from 'os';
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
			if(process.platform === "win32") {
				if(full_benchmark_path.endsWith(".exe")) {
					elements.push(new BenchmarkBinary(file, full_benchmark_path));
				}
			} else if (process.platform === "linux") {
				let file_stats = fs.statSync(full_benchmark_path);
				if(file_stats.mode === 33261) {
					elements.push(new BenchmarkBinary(file, full_benchmark_path));
				}
			} else if (process.platform === "darwin") {
				let file_stats = fs.statSync(full_benchmark_path);
				if(file_stats.mode === 33261) {
					elements.push(new BenchmarkBinary(file, full_benchmark_path));
				}
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

	vscode.commands.registerCommand('benchmark-vscode.showBenchmarkDetails', (benchmark) => {
		let panel = BenchmarkDetailsPanel.createOrShow(context.extensionUri, benchmark);
		panel._panel.webview.postMessage({ data: "Hello world" });
	});

	vscode.commands.registerCommand('benchmark-vscode.detailedView', () => {
		console.log("this will open default view");
	});

	vscode.commands.registerCommand('benchmark-vscode.runBenchmark', (benchmark) => {
		const { spawn } = require('node:child_process');
		const benchmark_binary = spawn(benchmark.full_path, ["--benchmark_format=json", "--benchmark_filter=" + benchmark.label]);
		provider.refresh();
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
		benchmarkBinary.iconPath = new vscode.ThemeIcon("loading~spin");
		const benchmark_binary = spawn(benchmarkBinary.full_path, ["--benchmark_format=json"]);
		provider.refresh();
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

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

class BenchmarkDetailsPanel {

	public static currentPanel: BenchmarkDetailsPanel | undefined;
	public readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	public static readonly viewType = 'benchmarkDetails';

	public static createOrShow(extensionUri: vscode.Uri, benchmark: Benchmark): BenchmarkDetailsPanel {
		
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		const panel = vscode.window.createWebviewPanel(
			BenchmarkDetailsPanel.viewType,
			benchmark.name,
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		BenchmarkDetailsPanel.currentPanel = new BenchmarkDetailsPanel(panel, extensionUri, benchmark);
		return BenchmarkDetailsPanel.currentPanel;
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, benchmark: Benchmark) {

		this._panel = panel;
		this._extensionUri = extensionUri;

		this._panel.webview.html = `<!DOCTYPE html>
			<html lang="en">
				<h1>${benchmark.name}</h1>
				<h3>${benchmark.results.length} runs in total</h3>
				<h4>${benchmark.full_path}</h4>
				<body>
					${benchmark.resultsAsHTMLTable()}
				</body>
			</html>`;
	}

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
		this.iconPath = new vscode.ThemeIcon('question');
		this.name = name;
		this.contextValue = 'benchmarkbinary';
	}

	addBenchmark(name: string) {
		this.iconPath = new vscode.ThemeIcon('beaker');
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
	name: string;

	constructor(name: string, full_path: string) {
		super(name);
		this.contextValue = 'benchmark';
		this.full_path = full_path;
		this.name = name;
	}

	addResult(real_time: number, time_unit: string, iterations: number) {
		let result = new BenchmarkResult(real_time, time_unit, iterations);
		this.results.push(result);
		this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
	}

	resultsAsHTMLTable(): string {
		let table = "<table border=\"1\"><tr><td>Timing</td><td>Iterations</td></tr>";
		for (const result of this.results) {
			table +=  `<tr><td>${result.real_time} (${result.time_unit})</td><td>${result.iterations}</td></tr>`;
		}
		return table += "</table>";
	}
}

class BenchmarkResult extends vscode.TreeItem {
	
	real_time: number;
	iterations: number;
	time_unit: string;

	constructor(real_time: number, time_unit: string, iterations: number) {
		super(new Date().toLocaleDateString() + ". " + real_time + time_unit + " - " + iterations + " iterations");
		this.iconPath = new vscode.ThemeIcon('testing-passed-icon');
		this.iterations = iterations;
		this.time_unit = time_unit;
		this.real_time = real_time;
	}
	contextValue = 'benchmark.extension.benchmark.result';
}