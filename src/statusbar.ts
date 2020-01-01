import * as coc from 'coc.nvim';
import {TextDocument} from 'vscode-languageserver-protocol';

import {CSpellUserSettings} from './server';
import { CSpellClient } from './client';
import { isSupportedUri, isSupportedDoc } from './util';

export function initStatusBar(context: coc.ExtensionContext, client: CSpellClient) {

  const sbCheck = coc.workspace.createStatusBarItem(0, { progress: true });
  sbCheck.text = 'cSpell';
  sbCheck.show();

  let lastUri = '';

  function updateStatusBarWithSpellCheckStatus(document?: TextDocument) {
    if (!document) return;

    sbCheck.text = 'cSpell';
    sbCheck.isProgress = true;
    sbCheck.show();

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

  async function onDidChange() {
    const doc = await coc.workspace.document;
    updateStatusBar(doc && doc.textDocument);
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

  context.subscriptions.push(
    coc.workspace.registerAutocmd({
      event: 'BufEnter',
      request: false,
      callback: onDidChange,
    }),
    coc.workspace.onDidChangeConfiguration(onDidChange),
    sbCheck
  );

  onDidChange();
}
