"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
describe('Validate Util Functions', () => {
    test('Logging', () => {
        util_1.setWorkspaceFolders([__dirname, __dirname]);
        util_1.log('log', __filename);
        util_1.logError('error');
        util_1.logDebug('debug');
        util_1.logInfo('info');
        expect(util_1.logger.getPendingEntries().map(e => e.msg)).toEqual([
            expect.stringContaining('setWorkspaceFolders'),
            expect.stringContaining('setWorkspaceBase'),
            expect.stringMatching(/log\s+.*util.test.ts/),
            expect.stringContaining('error'),
            expect.stringContaining('debug'),
            expect.stringContaining('info'),
        ]);
    });
    test('Unique filter', () => {
        expect([].filter(util_1.uniqueFilter())).toEqual([]);
        expect([1, 2, 3].filter(util_1.uniqueFilter())).toEqual([1, 2, 3]);
        expect([1, 2, 3, 3, 2, 1].filter(util_1.uniqueFilter())).toEqual([1, 2, 3]);
        const a = { id: 'a', v: 1 };
        const b = { id: 'b', v: 1 };
        const aa = { id: 'a', v: 2 };
        expect([a, a, b, aa, b].filter(util_1.uniqueFilter())).toEqual([a, b, aa]);
        expect([a, a, b, aa, b, aa].filter(util_1.uniqueFilter(a => a.id))).toEqual([a, b]);
    });
});
//# sourceMappingURL=util.test.js.map