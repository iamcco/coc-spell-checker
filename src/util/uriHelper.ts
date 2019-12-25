import { TextDocument } from 'vscode-languageserver-protocol';
import * as coc from 'coc.nvim';

export const supportedSchemes = ['file', 'untitled'];
export const setOfSupportedSchemes = new Set(supportedSchemes);

export function isSupportedUri(uri?: coc.Uri): boolean {
    return !!uri && setOfSupportedSchemes.has(uri.scheme);
}

export function isSupportedDoc(doc?: TextDocument): boolean {
    return !!doc && isSupportedUri(coc.Uri.parse(doc.uri));
}
