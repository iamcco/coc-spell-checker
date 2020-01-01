import { TextDocument, TextDocuments, CodeActionParams } from 'vscode-languageserver';
import { CodeAction } from 'vscode-languageserver-types';
import { CSpellUserSettings } from './cspellConfig';
import { DocumentSettings } from './documentSettings';
export declare function onCodeActionHandler(documents: TextDocuments, fnSettings: (doc: TextDocument) => Promise<CSpellUserSettings>, fnSettingsVersion: (doc: TextDocument) => number, documentSettings: DocumentSettings): (params: CodeActionParams) => Promise<CodeAction[]>;
