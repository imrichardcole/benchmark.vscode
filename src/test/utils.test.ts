import * as assert from 'assert';
import * as utils from "../utils";

suite('Utils test suite', () => {
	test('Iteration formatter tests', () => {
		let result = utils.format_iterations(1000);
		assert.strictEqual(result, "1,000");
	});
});
