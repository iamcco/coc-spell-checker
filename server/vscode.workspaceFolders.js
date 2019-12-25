"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("vscode-languageserver"));
const vscode = require("vscode-languageserver");
const util_1 = require("./util");
function registerOnDidChangeWorkspaceFolders(connection, callback) {
    const notificationType = new vscode.NotificationType('workspace/didChangeWorkspaceFolders');
    connection.onNotification(notificationType, callback);
}
exports.registerOnDidChangeWorkspaceFolders = registerOnDidChangeWorkspaceFolders;
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
        util_1.log(`getConfiguration`, uris);
        return connection.workspace.getConfiguration(params);
    }
    if (params) {
        util_1.log(`getConfiguration`, params.scopeUri);
        return connection.workspace.getConfiguration(params);
    }
    return connection.workspace.getConfiguration();
}
exports.getConfiguration = getConfiguration;
function getWorkspaceFolders(connection) {
    return connection.workspace.getWorkspaceFolders();
}
exports.getWorkspaceFolders = getWorkspaceFolders;
//# sourceMappingURL=vscode.workspaceFolders.js.map