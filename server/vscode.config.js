"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
function getConfiguration(connection, params) {
    if (typeof params === 'string') {
        util_1.log(`getConfiguration\t${params}`);
        return connection.workspace.getConfiguration(params);
    }
    if (Array.isArray(params)) {
        const uris = params
            .map(p => {
            if (!p) {
                return '';
            }
            if (typeof p === 'string') {
                return p;
            }
            return p.scopeUri || '';
        })
            .filter(p => !!p);
        util_1.log('getConfiguration', uris);
        return connection.workspace.getConfiguration(params);
    }
    if (params) {
        util_1.log('getConfiguration', params.scopeUri);
        return connection.workspace.getConfiguration(params);
    }
    return connection.workspace.getConfiguration();
}
exports.getConfiguration = getConfiguration;
/**
 * Just a pass through function to `connection.workspace.getWorkspaceFolders`
 * Useful for mocking.
 * @param connection
 */
function getWorkspaceFolders(connection) {
    return connection.workspace.getWorkspaceFolders();
}
exports.getWorkspaceFolders = getWorkspaceFolders;
//# sourceMappingURL=vscode.config.js.map