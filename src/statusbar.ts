import {CSpellUserSettings} from './server';
import * as coc from 'coc.nvim';
import { CSpellClient } from './client';
import { isSupportedUri, isSupportedDoc } from './util';
import {TextDocument} from 'vscode-languageserver-protocol';


export function initStatusBar(context: coc.ExtensionContext, client: CSpellClient) {

    const sbCheck = coc.workspace.createStatusBarItem(0, { progress: false });

    let lastUri = '';

    function updateStatusBarWithSpellCheckStatus(document?: TextDocument) {
        sbCheck.text = 'cSpell';
        sbCheck.isProgress = true;
        sbCheck.show();
        if (!document) return;

        const { uri } = document;
        lastUri = uri.toString();
        client.isSpellCheckEnabled(document)
            .then(async (response) => {
                sbCheck.isProgress = false;
                const doc = await coc.workspace.document;
                const document = doc && doc.textDocument;
                const docUri = document && document.uri;
                if (docUri === uri || !docUri || (coc.Uri.parse(docUri)).scheme !== 'file') {
                    const { languageEnabled = true, fileEnabled = true } = response;
                    const isChecked = languageEnabled && fileEnabled;
                    if (isChecked) {
                      sbCheck.show();
                    }
                } else {
                  sbCheck.hide();
                }
            });
    }

    function updateStatusBar(doc?: TextDocument) {
        const document = isSupportedDoc(doc) ? doc : selectDocument(doc);
        const settings: CSpellUserSettings = coc.workspace.getConfiguration().get('cSpell') as CSpellUserSettings;
        const { enabled, showStatus = true } = settings;

        if (!showStatus) {
            sbCheck.hide();
            return;
        }

        if (enabled) {
            updateStatusBarWithSpellCheckStatus(document);
        } else {
            sbCheck.hide();
        }
    }

    async function onDidChangeActiveTextEditor() {
        const doc = await coc.workspace.document;
        updateStatusBar(doc && doc.textDocument);
    }

    function onDidChangeConfiguration() {
        updateStatusBar();
    }

    function isViableEditor(document?: TextDocument) {
        if (!document) return false;

        return document &&
            document.uri &&
            isSupportedUri(coc.Uri.parse(document.uri));
    }

    function selectDocument(document?: TextDocument) {
        if (isViableEditor(document)) {
            return document;
        }

        const docs = coc.workspace.textDocuments
            .filter(isSupportedDoc);

        if (lastUri) {
            const candidate = docs
                .filter(document => document.uri.toString() === lastUri)
                .shift();
            if (candidate) return candidate;
        }

        return docs.shift();
    }

    sbCheck.text = 'cSpell';
    sbCheck.isProgress = true;
    sbCheck.show();

    context.subscriptions.push(
        coc.workspace.registerAutocmd({
          event: 'BufEnter',
          request: false,
          callback: onDidChangeActiveTextEditor,
        }),
        coc.workspace.onDidChangeConfiguration(onDidChangeConfiguration),
        coc.workspace.onDidCloseTextDocument(onDidChangeConfiguration),
        sbCheck
    );

    onDidChangeActiveTextEditor();

}

