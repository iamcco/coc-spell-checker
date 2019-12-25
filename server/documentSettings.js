"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("./vscode.workspaceFolders");
const path = require("path");
const fs = require("fs-extra");
const CSpell = require("cspell-lib");
const vscode_uri_1 = require("vscode-uri");
const util_1 = require("./util");
const autoLoad_1 = require("./autoLoad");
const cspell_glob_1 = require("cspell-glob");
const cSpellSection = 'cSpell';
const defaultExclude = [
    '**/*.rendered',
    '**/*.*.rendered',
    '__pycache__/**',
];
const defaultAllowedSchemes = ['file', 'untitled'];
const schemeBlackList = ['git', 'output', 'debug', 'vscode'];
const defaultRootUri = vscode_uri_1.URI.file('').toString();
class DocumentSettings {
    constructor(connection, defaultSettings) {
        this.connection = connection;
        this.defaultSettings = defaultSettings;
        // Cache per folder settings
        this.cachedValues = [];
        this.getUriSettings = this.createCache((key = '') => this._getUriSettings(key));
        this.fetchSettingsForUri = this.createCache((key) => this._fetchSettingsForFolderUri(key));
        this._cspellFileSettingsByFolderCache = this.createCache(readSettingsForFolderUri);
        this.fetchVSCodeConfiguration = this.createCache((key) => this._fetchVSCodeConfiguration(key));
        this._folders = this.createLazy(() => this.fetchFolders());
        this.configsToImport = new Set();
        this.importedSettings = this.createLazy(() => this._importSettings());
        this._version = 0;
    }
    async getSettings(document) {
        return this.getUriSettings(document.uri);
    }
    async _getUriSettings(uri) {
        util_1.log('getUriSettings:', uri);
        const r = uri
            ? await this.fetchUriSettings(uri)
            : CSpell.mergeSettings(this.defaultSettings, this.importedSettings());
        return r;
    }
    async isExcluded(uri) {
        const settingsByWorkspaceFolder = await this.findMatchingFolderSettings(uri);
        const fnExclTests = settingsByWorkspaceFolder.map(s => ((filename) => s.globMatcher.match(filename)));
        for (const fn of fnExclTests) {
            if (fn(vscode_uri_1.URI.parse(uri).path)) {
                return true;
            }
        }
        return false;
    }
    resetSettings() {
        util_1.log(`resetSettings`);
        CSpell.clearCachedSettings();
        this.cachedValues.forEach(cache => cache.clear());
        this._version += 1;
    }
    get folders() {
        return this._folders();
    }
    _importSettings() {
        util_1.log(`importSettings`);
        const importPaths = [...this.configsToImport.keys()].sort();
        return CSpell.readSettingsFiles(importPaths);
    }
    get version() {
        return this._version;
    }
    registerConfigurationFile(path) {
        util_1.log('registerConfigurationFile:', path);
        this.configsToImport.add(path);
        this.importedSettings.clear();
        this.resetSettings();
    }
    async fetchUriSettings(uri) {
        util_1.log('Start fetchUriSettings:', uri);
        const folder = await this.findMatchingFolder(uri);
        const folderSettings = await this.fetchSettingsForUri(folder.uri);
        const spellSettings = CSpell.mergeSettings(this.defaultSettings, this.importedSettings(), folderSettings.settings);
        const fileUri = vscode_uri_1.URI.parse(uri);
        const fileSettings = CSpell.calcOverrideSettings(spellSettings, fileUri.fsPath);
        util_1.log('Finish fetchUriSettings:', uri);
        return fileSettings;
    }
    async findMatchingFolder(docUri) {
        const root = vscode_uri_1.URI.parse(docUri || defaultRootUri).with({ path: '' });
        return (await this.matchingFoldersForUri(docUri))[0] || { uri: root.toString(), name: 'root' };
    }
    async fetchFolders() {
        return (await vscode.getWorkspaceFolders(this.connection)) || [];
    }
    async findMatchingFolderSettings(docUri) {
        const matches = (await this.matchingFoldersForUri(docUri))
            .map(folder => folder.uri)
            .map(uri => this.fetchSettingsForUri(uri));
        if (matches.length) {
            return Promise.all(matches);
        }
        const { uri } = (await this.folders)[0] || { uri: docUri };
        return [await this.fetchSettingsForUri(uri)];
    }
    async _fetchVSCodeConfiguration(uri) {
        return (await vscode.getConfiguration(this.connection, [
            { scopeUri: uri || undefined, section: cSpellSection },
            { section: 'search' }
        ])).map(v => v || {});
    }
    async fetchSettingsFromVSCode(uri) {
        const configs = await this.fetchVSCodeConfiguration(uri || '');
        const [cSpell, search] = configs;
        const { exclude = {} } = search;
        const { ignorePaths = [] } = cSpell;
        const cSpellConfigSettings = Object.assign(Object.assign({}, cSpell), { id: 'VSCode-Config', ignorePaths: ignorePaths.concat(CSpell.ExclusionHelper.extractGlobsFromExcludeFilesGlobMap(exclude)) });
        return cSpellConfigSettings;
    }
    async _fetchSettingsForFolderUri(uri) {
        util_1.log(`fetchFolderSettings: URI ${uri}`);
        const cSpellConfigSettings = await this.fetchSettingsFromVSCode(uri);
        const cSpellFolderSettings = this.resolveConfigImports(cSpellConfigSettings, uri);
        const settings = this._cspellFileSettingsByFolderCache.get(uri);
        // cspell.json file settings take precedence over the vscode settings.
        const mergedSettings = CSpell.mergeSettings(cSpellFolderSettings, settings);
        const { ignorePaths = [] } = mergedSettings;
        const globs = defaultExclude.concat(ignorePaths);
        const root = vscode_uri_1.URI.parse(uri).path;
        const globMatcher = new cspell_glob_1.GlobMatcher(globs, root);
        const ext = {
            uri,
            vscodeSettings: { cSpell: cSpellConfigSettings },
            settings: mergedSettings,
            globMatcher,
        };
        return ext;
    }
    async matchingFoldersForUri(docUri) {
        const folders = await this.folders;
        return folders
            .filter(({ uri }) => uri === docUri.slice(0, uri.length))
            .sort((a, b) => a.uri.length - b.uri.length)
            .reverse();
    }
    createCache(loader) {
        const cache = autoLoad_1.createAutoLoadCache(loader);
        this.cachedValues.push(cache);
        return cache;
    }
    createLazy(loader) {
        const lazy = autoLoad_1.createLazyValue(loader);
        this.cachedValues.push(lazy);
        return lazy;
    }
    resolveConfigImports(config, folderUri) {
        const uriFsPath = vscode_uri_1.URI.parse(folderUri).fsPath;
        const imports = typeof config.import === 'string' ? [config.import] : config.import || [];
        if (!imports.length) {
            return config;
        }
        const importAbsPath = imports.map(file => path.resolve(file, uriFsPath));
        return CSpell.mergeSettings(CSpell.readSettingsFiles(importAbsPath), config);
    }
}
exports.DocumentSettings = DocumentSettings;
function configPathsForRoot(workspaceRootUri) {
    const workspaceRoot = workspaceRootUri ? vscode_uri_1.URI.parse(workspaceRootUri).fsPath : '';
    const paths = workspaceRoot ? [
        path.join(workspaceRoot, '.vscode', CSpell.defaultSettingsFilename.toLowerCase()),
        path.join(workspaceRoot, '.vscode', CSpell.defaultSettingsFilename),
        path.join(workspaceRoot, '.' + CSpell.defaultSettingsFilename.toLowerCase()),
        path.join(workspaceRoot, CSpell.defaultSettingsFilename.toLowerCase()),
        path.join(workspaceRoot, CSpell.defaultSettingsFilename),
    ] : [];
    return paths;
}
function readSettingsForFolderUri(uri) {
    return uri ? readSettingsFiles(configPathsForRoot(uri)) : {};
}
function readSettingsFiles(paths) {
    util_1.log(`readSettingsFiles:`, paths);
    const existingPaths = paths.filter(filename => fs.existsSync(filename));
    return CSpell.readSettingsFiles(existingPaths);
}
function isUriAllowed(uri, schemes) {
    schemes = schemes || defaultAllowedSchemes;
    return doesUriMatchAnyScheme(uri, schemes);
}
exports.isUriAllowed = isUriAllowed;
function isUriBlackListed(uri, schemes = schemeBlackList) {
    return doesUriMatchAnyScheme(uri, schemes);
}
exports.isUriBlackListed = isUriBlackListed;
function doesUriMatchAnyScheme(uri, schemes) {
    const schema = vscode_uri_1.URI.parse(uri).scheme;
    return schemes.findIndex(v => v === schema) >= 0;
}
exports.doesUriMatchAnyScheme = doesUriMatchAnyScheme;
//# sourceMappingURL=documentSettings.js.map