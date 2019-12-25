"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const documentSettings_1 = require("./documentSettings");
const vscode_workspaceFolders_1 = require("./vscode.workspaceFolders");
const Path = require("path");
const vscode_uri_1 = require("vscode-uri");
// import * as vscode from './vscode.workspaceFolders';
jest.mock('vscode-languageserver');
jest.mock('./vscode.workspaceFolders');
jest.mock('./util');
const mock_getWorkspaceFolders = vscode_workspaceFolders_1.getWorkspaceFolders;
const mock_getConfiguration = vscode_workspaceFolders_1.getConfiguration;
const workspaceRoot = Path.resolve(Path.join(__dirname, '..'));
const workspaceFolder = {
    uri: vscode_uri_1.URI.file(workspaceRoot).toString(),
    name: '_server',
};
describe('Validate DocumentSettings', () => {
    beforeEach(() => {
        // Clear all mock instances and calls to constructor and all methods:
        mock_getWorkspaceFolders.mockClear();
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
        mock_getWorkspaceFolders.mockReturnValue(mockFolders);
        const docSettings = newDocumentSettings();
        const folders = await docSettings.folders;
        expect(folders).toBe(mockFolders);
    });
    it('tests register config path', () => {
        const mockFolders = [workspaceFolder];
        mock_getWorkspaceFolders.mockReturnValue(mockFolders);
        const docSettings = newDocumentSettings();
        const configFile = Path.resolve(Path.join(__dirname, '..', '..', '..', 'cSpell.json'));
        expect(docSettings.version).toEqual(0);
        docSettings.registerConfigurationFile(configFile);
        expect(docSettings.version).toEqual(1);
        expect(docSettings.configsToImport).toContain(configFile);
    });
    it('test getSettings', async () => {
        const mockFolders = [workspaceFolder];
        mock_getWorkspaceFolders.mockReturnValue(mockFolders);
        mock_getConfiguration.mockReturnValue([{}, {}]);
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
        mock_getWorkspaceFolders.mockReturnValue(mockFolders);
        mock_getConfiguration.mockReturnValue([{}, {}]);
        const docSettings = newDocumentSettings();
        const configFile = Path.resolve(Path.join(__dirname, '..', 'sampleSourceFiles', 'cSpell.json'));
        docSettings.registerConfigurationFile(configFile);
        const result = await docSettings.isExcluded(vscode_uri_1.URI.file(__filename).toString());
        expect(result).toBe(false);
    });
    function newDocumentSettings() {
        return new documentSettings_1.DocumentSettings({}, {});
    }
});
//# sourceMappingURL=documentSettings.test.js.map