import { TextDocument, Diagnostic } from 'vscode-languageserver';
import { CSpellUserSettings } from './cspellConfig';
import { Sequence } from 'gensequence';
export { validateText } from 'cspell-lib';
export declare const diagnosticCollectionName = "cSpell";
export declare const diagSource = "cSpell";
export declare const defaultCheckLimit = 500;
export declare function validateTextDocument(textDocument: TextDocument, options: CSpellUserSettings): Promise<Diagnostic[]>;
export declare function validateTextDocumentAsync(textDocument: TextDocument, options: CSpellUserSettings): Promise<Sequence<Diagnostic>>;
