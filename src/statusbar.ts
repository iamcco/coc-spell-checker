import * as coc from 'coc.nvim';
import {TextDocument} from 'vscode-languageserver-protocol';

import {CSpellUserSettings} from './server';
import { CSpellClient } from './client';
import { isSupportedDoc } from './util';

export function initStatusBar(context: coc.ExtensionContext, client: CSpellClient) {
  const statusText = coc.workspace.getConfiguration('cSpell').get('status-bar-text', 'cSpell');

  const sbCheck = coc.workspace.createStatusBarItem(999, { progress: true });
  sbCheck.text = statusText;
  sbCheck.show();

  function updateStatusBarWithSpellCheckStatus(document?: TextDocument) {
    if (!document) return;

    sbCheck.text = statusText;
    sbCheck.isProgress = true;
    sbCheck.show();

    const { uri } = document;
    client.isSpellCheckEnabled(document)
      .then(async (response) => {
        sbCheck.isProgress = false;
        const doc = await coc.workspace.document;
        const document = doc && doc.textDocument;
        const docUri = document && document.uri;
        if (docUri !== uri) {
          return;
        }
        const { languageEnabled = false, fileEnabled = false } = response;
        const isChecked = languageEnabled && fileEnabled;
        if (isChecked) {
          sbCheck.show();
        } else {
          sbCheck.hide();
        }
      });
  }

  function updateStatusBar(doc?: TextDocument) {
    if (!isSupportedDoc(doc)) {
      sbCheck.hide();
      return;
    }
    const document = doc;
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
