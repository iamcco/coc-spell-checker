import { performance } from '../util/perf';
performance.mark('cSpellInfo.ts');
import * as coc from 'coc.nvim';
import { TextDocument } from 'vscode-languageserver-protocol';
import {Maybe} from '../util';

export const commandDisplayCSpellInfo    = 'cSpell.displayCSpellInfo';

export async function findDocumentInVisibleTextEditors(uri: coc.Uri): Promise<Maybe<TextDocument>> {
    const u = uri.toString();
    const doc = await coc.workspace.document;
    if (doc.textDocument.uri === u) {
      return doc.textDocument;
    }
}

export async function findMatchingDocument(uri: coc.Uri): Promise<Maybe<TextDocument>> {
    const u = uri.toString();
    const workspace = coc.workspace || {};
    const docs = (workspace.textDocuments || [])
        .filter(doc => doc.uri.toString() === u);
    return docs[0] || findDocumentInVisibleTextEditors(uri);
}

performance.mark('cSpellInfo.ts Done');
