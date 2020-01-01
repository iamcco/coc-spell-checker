import { Connection, TextDocumentUri } from './vscode.workspaceFolders';
import * as vscode from './vscode.workspaceFolders';
import { ExcludeFilesGlobMap } from 'cspell-lib';
import { CSpellUserSettings } from './cspellConfig';
import { AutoLoadCache } from './autoLoad';
export interface SettingsCspell {
    cSpell?: CSpellUserSettings;
}
export interface SettingsVSCode {
    search?: {
        exclude?: ExcludeFilesGlobMap;
    };
}
export declare class DocumentSettings {
    readonly connection: Connection;
    readonly defaultSettings: CSpellUserSettings;
    private cachedValues;
    readonly getUriSettings: AutoLoadCache<string | undefined, Promise<CSpellUserSettings>>;
    private readonly fetchSettingsForUri;
    private readonly _cspellFileSettingsByFolderCache;
    private readonly fetchVSCodeConfiguration;
    private readonly _folders;
    readonly configsToImport: Set<string>;
    private readonly importedSettings;
    private _version;
    constructor(connection: Connection, defaultSettings: CSpellUserSettings);
    getSettings(document: TextDocumentUri): Promise<CSpellUserSettings>;
    _getUriSettings(uri: string): Promise<CSpellUserSettings>;
    isExcluded(uri: string): Promise<boolean>;
    resetSettings(): void;
    get folders(): Promise<vscode.WorkspaceFolder[]>;
    private _importSettings;
    get version(): number;
    registerConfigurationFile(path: string): void;
    private fetchUriSettings;
    private findMatchingFolder;
    private fetchFolders;
    private findMatchingFolderSettings;
    private _fetchVSCodeConfiguration;
    private fetchSettingsFromVSCode;
    private _fetchSettingsForFolderUri;
    private matchingFoldersForUri;
    private createCache;
    private createLazy;
    private resolveConfigImports;
}
export declare function isUriAllowed(uri: string, schemes?: string[]): boolean;
export declare function isUriBlackListed(uri: string, schemes?: string[]): boolean;
export declare function doesUriMatchAnyScheme(uri: string, schemes: string[]): boolean;
