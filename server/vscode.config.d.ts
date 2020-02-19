import * as vscode from 'vscode-languageserver';
export interface TextDocumentUri {
    uri: string;
}
export interface TextDocumentUriLangId extends TextDocumentUri {
    languageId: string;
}
export declare type Connection = vscode.Connection;
export declare type GetConfigurationParams = string | vscode.ConfigurationItem | vscode.ConfigurationItem[];
export declare function getConfiguration(connection: Connection): Thenable<any>;
export declare function getConfiguration(connection: Connection, section: string): Thenable<any>;
export declare function getConfiguration(connection: Connection, item: vscode.ConfigurationItem): Thenable<any>;
export declare function getConfiguration(connection: Connection, items: vscode.ConfigurationItem[]): Thenable<any[]>;
/**
 * Just a pass through function to `connection.workspace.getWorkspaceFolders`
 * Useful for mocking.
 * @param connection
 */
export declare function getWorkspaceFolders(connection: Connection): Thenable<vscode.WorkspaceFolder[] | null>;
