"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const documentSettings_1 = require("./documentSettings");
const vscode_config_1 = require("./vscode.config");
const Path = require("path");
const vscode_uri_1 = require("vscode-uri");
const cspell = require("cspell-lib");
const os = require("os");
jest.mock('vscode-languageserver');
jest.mock('./vscode.config');
jest.mock('./util');
const mockGetWorkspaceFolders = vscode_config_1.getWorkspaceFolders;
const mockGetConfiguration = vscode_config_1.getConfiguration;
const workspaceRoot = Path.resolve(Path.join(__dirname, '..'));
const workspaceFolder = {
    uri: vscode_uri_1.URI.file(workspaceRoot).toString(),
    name: '_server',
};
describe('Validate DocumentSettings', () => {
    beforeEach(() => {
        // Clear all mock instances and calls to constructor and all methods:
        mockGetWorkspaceFolders.mockClear();
    });
    test('version', () => {
        const docSettings = newDocumentSettings();
        expect(docSettings.version).toEqual(0);
        docSettings.resetSettings();
        expect(docSettings.version).toEqual(1);
    });
    it('checks isUriAllowed', () => {
        expect(documentSettings_1.isUriAllowed(vscode_uri_1.URI.file(__filename).toString())).toBe(true);
    });
    it('checks isUriBlackListed', () => {
        const uriFile = vscode_uri_1.URI.file(__filename);
        expect(documentSettings_1.isUriBlackListed(uriFile.toString())).toBe(false);
        const uriGit = uriFile.with({ scheme: 'debug' });
        expect(documentSettings_1.isUriBlackListed(uriGit.toString())).toBe(true);
    });
    it('folders', async () => {
        const mockFolders = [workspaceFolder];
        mockGetWorkspaceFolders.mockReturnValue(mockFolders);
        const docSettings = newDocumentSettings();
        const folders = await docSettings.folders;
        expect(folders).toBe(mockFolders);
    });
    it('tests register config path', () => {
        const mockFolders = [workspaceFolder];
        mockGetWorkspaceFolders.mockReturnValue(mockFolders);
        const docSettings = newDocumentSettings();
        const configFile = Path.resolve(Path.join(__dirname, '..', '..', '..', 'cSpell.json'));
        expect(docSettings.version).toEqual(0);
        docSettings.registerConfigurationFile(configFile);
        expect(docSettings.version).toEqual(1);
        expect(docSettings.configsToImport).toContain(configFile);
    });
    it('test getSettings', async () => {
        const mockFolders = [workspaceFolder];
        mockGetWorkspaceFolders.mockReturnValue(mockFolders);
        mockGetConfiguration.mockReturnValue([{}, {}]);
        const docSettings = newDocumentSettings();
        const configFile = Path.resolve(Path.join(__dirname, '..', 'sampleSourceFiles', 'cSpell.json'));
        docSettings.registerConfigurationFile(configFile);
        const settings = await docSettings.getSettings({ uri: vscode_uri_1.URI.file(__filename).toString() });
        expect(settings).toHaveProperty('name');
        expect(settings.enabled).toBeUndefined();
        expect(settings.language).toBe('en-gb');
    });
    it('test isExcluded', async () => {
        const mockFolders = [workspaceFolder];
        mockGetWorkspaceFolders.mockReturnValue(mockFolders);
        mockGetConfiguration.mockReturnValue([{}, {}]);
        const docSettings = newDocumentSettings();
        const configFile = Path.resolve(Path.join(__dirname, '..', 'sampleSourceFiles', 'cSpell.json'));
        docSettings.registerConfigurationFile(configFile);
        const result = await docSettings.isExcluded(vscode_uri_1.URI.file(__filename).toString());
        expect(result).toBe(false);
    });
    test('resolvePath', () => {
        expect(documentSettings_1.debugExports.resolvePath(__dirname)).toBe(__dirname);
        expect(documentSettings_1.debugExports.resolvePath('~')).toBe(os.homedir());
    });
    function newDocumentSettings() {
        return new documentSettings_1.DocumentSettings({}, {});
    }
});
describe('Validate RegExp corrections', () => {
    test('fixRegEx', () => {
        var _a, _b;
        const defaultSettings = cspell.getDefaultSettings();
        // Make sure it doesn't change the defaults.
        expect((_a = defaultSettings.patterns) === null || _a === void 0 ? void 0 : _a.map(p => p.pattern).map(documentSettings_1.debugExports.fixRegEx))
            .toEqual((_b = defaultSettings.patterns) === null || _b === void 0 ? void 0 : _b.map(p => p.pattern));
        const sampleRegEx = [
            '/#.*/',
            '/"""(.*?\\n?)+?"""/g',
            '/\'\'\'(.*?\\n?)+?\'\'\'/g',
            'strings',
        ];
        const expectedRegEx = [
            '/#.*/',
            '/(""")[^\\1]*?\\1/g',
            "/(''')[^\\1]*?\\1/g",
            'strings',
        ];
        expect(sampleRegEx.map(documentSettings_1.debugExports.fixRegEx)).toEqual(expectedRegEx);
    });
    test('fixPattern', () => {
        var _a;
        const defaultSettings = cspell.getDefaultSettings();
        // Make sure it doesn't change the defaults.
        expect((_a = defaultSettings.patterns) === null || _a === void 0 ? void 0 : _a.map(documentSettings_1.debugExports.fixPattern))
            .toEqual(defaultSettings.patterns);
    });
    test('fixPattern', () => {
        const defaultSettings = cspell.getDefaultSettings();
        // Make sure it doesn't change the defaults.
        expect(documentSettings_1.correctBadSettings(defaultSettings))
            .toEqual(defaultSettings);
        const settings = {
            patterns: [
                {
                    name: 'strings',
                    pattern: '/"""(.*?\\n?)+?"""/g',
                }
            ]
        };
        const expectedSettings = {
            patterns: [
                {
                    name: 'strings',
                    pattern: '/(""")[^\\1]*?\\1/g',
                }
            ]
        };
        expect(documentSettings_1.correctBadSettings(settings)).toEqual(expectedSettings);
        expect(documentSettings_1.correctBadSettings(settings)).not.toEqual(settings);
    });
});
//# sourceMappingURL=documentSettings.test.js.map