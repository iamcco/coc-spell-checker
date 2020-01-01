export * from 'vscode-languageserver';
import * as vscode from 'vscode-languageserver';
export interface WorkspaceFolder {
    /**
     * The associated URI for this workspace folder.
     */
    uri: string;
    /**
     * The name of the workspace folder. Defaults to the
     * uri's basename.
     */
    name: string;
}
export interface DidChangeWorkspaceFoldersParams {
    /**
     * The actual workspace folder change event.
     */
    event: WorkspaceFoldersChangeEvent;
}
/**
 * The workspace folder change event.
 */
export interface WorkspaceFoldersChangeEvent {
    /**
     * The array of added workspace folders
     */
    added: WorkspaceFolder[];
    /**
     * The array of the removed workspace folders
     */
    removed: WorkspaceFolder[];
}
export interface ExtendedInitializeParams extends vscode.InitializeParams {
    workspaceFolders: WorkspaceFolder[];
}
export declare function registerOnDidChangeWorkspaceFolders(connection: vscode.Connection, callback: (params: DidChangeWorkspaceFoldersParams) => void): void;
export declare type Connection = vscode.Connection;
export interface TextDocumentUri {
    uri: string;
}
export interface TextDocumentUriLangId extends TextDocumentUri {
    languageId: string;
}
export declare type GetConfigurationParams = string | vscode.ConfigurationItem | vscode.ConfigurationItem[];
export declare function getConfiguration(connection: Connection): Thenable<any>;
export declare function getConfiguration(connection: Connection, section: string): Thenable<any>;
export declare function getConfiguration(connection: Connection, item: vscode.ConfigurationItem): Thenable<any>;
export declare function getConfiguration(connection: Connection, items: vscode.ConfigurationItem[]): Thenable<any[]>;
export declare function getWorkspaceFolders(connection: Connection): Thenable<WorkspaceFolder[] | null>;
