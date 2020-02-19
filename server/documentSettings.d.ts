import { Connection, TextDocumentUri } from './vscode.config';
import * as vscode from 'vscode-languageserver';
import { ExcludeFilesGlobMap, RegExpPatternDefinition, Pattern } from 'cspell-lib';
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
    private _fetchVSCodeConfiguration;
    private fetchSettingsFromVSCode;
    private _fetchSettingsForUri;
    private matchingFoldersForUri;
    private createCache;
    private createLazy;
    private readSettingsForFolderUri;
}
declare function resolvePath(...parts: string[]): string;
export declare function isUriAllowed(uri: string, schemes?: string[]): boolean;
export declare function isUriBlackListed(uri: string, schemes?: string[]): boolean;
export declare function doesUriMatchAnyScheme(uri: string, schemes: string[]): boolean;
declare function fixRegEx(pat: Pattern): Pattern;
declare function fixPattern(pat: RegExpPatternDefinition): RegExpPatternDefinition;
export declare function correctBadSettings(settings: CSpellUserSettings): CSpellUserSettings;
export declare const debugExports: {
    fixRegEx: typeof fixRegEx;
    fixPattern: typeof fixPattern;
    resolvePath: typeof resolvePath;
};
export {};
