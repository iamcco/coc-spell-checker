"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// cSpell:ignore pycache
const vscode_config_1 = require("./vscode.config");
const path = require("path");
const fs = require("fs-extra");
const CSpell = require("cspell-lib");
const vscode_uri_1 = require("vscode-uri");
const util_1 = require("./util");
const autoLoad_1 = require("./autoLoad");
const cspell_glob_1 = require("cspell-glob");
const os = require("os");
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
        this.fetchSettingsForUri = this.createCache((key) => this._fetchSettingsForUri(key));
        this._cspellFileSettingsByFolderCache = this.createCache(_readSettingsForFolderUri);
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
        const settings = await this.fetchSettingsForUri(uri);
        return settings.globMatcher.match(vscode_uri_1.URI.parse(uri).path);
    }
    resetSettings() {
        util_1.log('resetSettings');
        CSpell.clearCachedSettings();
        this.cachedValues.forEach(cache => cache.clear());
        this._version += 1;
    }
    get folders() {
        return this._folders();
    }
    _importSettings() {
        util_1.log('importSettings');
        const importPaths = [...this.configsToImport.keys()].sort();
        return readSettingsFiles(importPaths);
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
        const folderSettings = await this.fetchSettingsForUri(uri);
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
        return (await vscode_config_1.getWorkspaceFolders(this.connection)) || [];
    }
    async _fetchVSCodeConfiguration(uri) {
        return (await vscode_config_1.getConfiguration(this.connection, [
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
    async _fetchSettingsForUri(uri) {
        util_1.log(`fetchFolderSettings: URI ${uri}`);
        const cSpellConfigSettings = await this.fetchSettingsFromVSCode(uri);
        const folder = await this.findMatchingFolder(uri);
        const cSpellFolderSettings = resolveConfigImports(cSpellConfigSettings, folder.uri);
        const settings = this.readSettingsForFolderUri(folder.uri);
        // cspell.json file settings take precedence over the vscode settings.
        const mergedSettings = CSpell.mergeSettings(cSpellFolderSettings, settings);
        const { ignorePaths = [] } = mergedSettings;
        const globs = defaultExclude.concat(ignorePaths);
        const root = vscode_uri_1.URI.parse(folder.uri).path;
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
    readSettingsForFolderUri(folderUri) {
        return this._cspellFileSettingsByFolderCache.get(folderUri);
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
function resolveConfigImports(config, folderUri) {
    util_1.log('resolveConfigImports:', folderUri);
    const uriFsPath = vscode_uri_1.URI.parse(folderUri).fsPath;
    const imports = typeof config.import === 'string' ? [config.import] : config.import || [];
    const importAbsPath = imports.map(file => resolvePath(uriFsPath, file));
    util_1.log(`resolvingConfigImports: [\n${imports.join('\n')}]`);
    util_1.log(`resolvingConfigImports ABS: [\n${importAbsPath.join('\n')}]`);
    const _a = importAbsPath.length
        ? CSpell.mergeSettings(readSettingsFiles([...importAbsPath]), config)
        : config, { import: _import } = _a, result = __rest(_a, ["import"]);
    return result;
}
function _readSettingsForFolderUri(folderUri) {
    return folderUri ? readSettingsFiles(configPathsForRoot(folderUri)) : {};
}
function readSettingsFiles(paths) {
    util_1.log('readSettingsFiles:', paths);
    const existingPaths = paths.filter(filename => exists(filename));
    util_1.log('readSettingsFiles actual:', existingPaths);
    return existingPaths.length ? CSpell.readSettingsFiles(existingPaths) : {};
}
function exists(file) {
    try {
        const s = fs.statSync(file);
        return s.isFile();
    }
    catch (e) { }
    return false;
}
function resolvePath(...parts) {
    const normalizedParts = parts.map(part => part[0] === '~' ? os.homedir() + part.slice(1) : part);
    return path.resolve(...normalizedParts);
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
const correctRegExMap = new Map([
    ['/"""(.*?\\n?)+?"""/g', '/(""")[^\\1]*?\\1/g'],
    ["/'''(.*?\\n?)+?'''/g", "/(''')[^\\1]*?\\1/g"],
]);
function fixRegEx(pat) {
    if (typeof pat != 'string') {
        return pat;
    }
    return correctRegExMap.get(pat) || pat;
}
function fixPattern(pat) {
    const pattern = fixRegEx(pat.pattern);
    if (pattern === pat.pattern) {
        return pat;
    }
    return Object.assign(Object.assign({}, pat), { pattern });
}
function correctBadSettings(settings) {
    var _a, _b, _c, _d, _e, _f;
    const newSettings = Object.assign({}, settings);
    // Fix patterns
    newSettings.patterns = (_b = (_a = newSettings) === null || _a === void 0 ? void 0 : _a.patterns) === null || _b === void 0 ? void 0 : _b.map(fixPattern);
    newSettings.ignoreRegExpList = (_d = (_c = newSettings) === null || _c === void 0 ? void 0 : _c.ignoreRegExpList) === null || _d === void 0 ? void 0 : _d.map(fixRegEx);
    newSettings.includeRegExpList = (_f = (_e = newSettings) === null || _e === void 0 ? void 0 : _e.includeRegExpList) === null || _f === void 0 ? void 0 : _f.map(fixRegEx);
    return newSettings;
}
exports.correctBadSettings = correctBadSettings;
exports.debugExports = {
    fixRegEx,
    fixPattern,
    resolvePath,
};
//# sourceMappingURL=documentSettings.js.map