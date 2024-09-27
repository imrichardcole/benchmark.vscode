import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let elements = [
		new BenchmarkBinary("benchmark_heavy_maths"),
		new BenchmarkBinary("benchmark_strings"),
	];
	const provider = new BenchmarkDataProvider(elements);

	vscode.commands.registerCommand('benchmark-vscode.runBenchmark', (benchmarkBinary) => {
		console.log("Running " + benchmarkBinary.name);
		const { spawn } = require('node:child_process');
		const fullPath = `C:/sandbox/work/vscode/benchmark.vscode/benchmark/build/Release/${ benchmarkBinary.name }.exe`;
		const benchmark_binary = spawn(fullPath, ["--benchmark_format=json"]);
		var scriptOutput = "";
		benchmark_binary.on('exit', function (code: any) {
			console.log("process exited with code - " + code);
			try {
				const output_json = JSON.parse(scriptOutput.toString());
				output_json["benchmarks"].forEach((element: { [x: string]: string; }) => {
					let real_time = Math.round(parseFloat(element["real_time"]));
					benchmarkBinary.addResult(element["name"] + ": " + element["iterations"] + " iterations - " + real_time + " " + element["time_unit"]);
				});
				vscode.window.showInformationMessage("Benchmark: finished running benchmark");
				provider.refresh();
			} catch (e: any) {
				const result = e.message;
				vscode.window.showErrorMessage("Benchmark: issue running benchmark");
			}
		});
		benchmark_binary.stdout.on('data', (data: any) => {
			scriptOutput += data;
		});

	});


	vscode.window.registerTreeDataProvider("benchmarks", provider);
}

export function deactivate() {}

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

	getChildren(element?: BenchmarkBinary | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
		if(element === undefined) {
			return this.elements;
		} 
		return element.results;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

}

class BenchmarkBinary extends vscode.TreeItem {

	name: string;
	results: vscode.TreeItem[];

	constructor(name: string, results?: BenchmarkResult[]) {
		super(name,
			results === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded
		);
		this.results = [];
		this.iconPath =  new vscode.ThemeIcon('testing-run-all-icon');
		this.command = {
			command: "benchmark-vscode.runBenchmark",
			arguments: [this],
			title: ""
		};
		this.name = name;
	}

	addResult(result: string) {
		this.results.push(new BenchmarkResult(result));
		this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
	}

}

class BenchmarkResult extends vscode.TreeItem {

	constructor(name: string) {
		super(name);
		this.iconPath =  new vscode.ThemeIcon('testing-passed-icon');
		this.command = {
            title: name,
            command: "vscode.show.openTextDocument",
            arguments: [ "this is my example text!"]
        };
	}

}