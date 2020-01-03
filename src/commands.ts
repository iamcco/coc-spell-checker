import * as coc from 'coc.nvim';
import { TextEdit, TextDocument, Range } from 'vscode-languageserver-protocol';

import * as CSpellSettings from './settings/CSpellSettings';
import * as Settings from './settings';
export { toggleEnableSpellChecker, enableCurrentLanguage, disableCurrentLanguage } from './settings';

const rangeContain = (origin: Range, target: Range): boolean => {
  return origin.start.line <= target.start.line
    && origin.start.character <= target.start.character
    && origin.end.line >= target.end.line
    && origin.end.character >= target.end.character;
};

export function handlerApplyTextEdits(_client: coc.LanguageClient) {
  return async function applyTextEdits(uri: string, documentVersion: number, edits: TextEdit[]) {
    const doc = await coc.workspace.document;
    const activeDoc = doc && doc.textDocument;
    if (activeDoc && activeDoc.uri === uri) {
      if (activeDoc.version !== documentVersion) {
        return coc.workspace.showMessage(`Spelling changes are outdated and cannot be applied to the document.`);
      }
      const cfg = coc.workspace.getConfiguration(CSpellSettings.sectionCSpell);
      if (cfg.get('fixSpellingWithRenameProvider') && edits.length === 1) {
        const edit = edits[0];
        if (await attemptRename(activeDoc, edit.range, edit.newText)) {
          return;
        }
      }

      coc.workspace.applyEdit({
        changes: {
          [uri]: edits
        }
      });
    }
  };
}

async function attemptRename(document: TextDocument, range: Range, text: string): Promise<boolean | undefined> {
  if (!coc.languages.hasProvider('rename', document)) {
    return false;
  }
  if (range.start.line !== range.end.line) {
    return false;
  }
  const doc = await coc.workspace.getDocument(document.uri);
  const wordRange = doc.getWordRangeAtPosition(range.start);
  if (!wordRange || !rangeContain(wordRange, range)) {
    return false;
  }
  const prepareRename = await coc.languages.prepareRename(document, range.start);
  if (prepareRename === false) {
    return false;
  }
  const orig = wordRange.start.character;
  const a = range.start.character - orig;
  const b = range.end.character - orig;
  const docText = document.getText(wordRange);
  const newText = [docText.slice(0, a), text, docText.slice(b)].join('');
  const workspaceEdit = await coc.languages.provideRenameEdits(document, range.start, newText);
  return workspaceEdit && await coc.workspace.applyEdit(workspaceEdit);
}

export function addWordToWorkspaceDictionary(word: string, uri: string | null | coc.Uri | undefined): Thenable<void> {
  return addWordToTarget(word, Settings.Target.Workspace, uri);
}

export function addWordToUserDictionary(word: string): Thenable<void> {
  return addWordToTarget(word, Settings.Target.Global, undefined);
}

async function addWordToTarget(word: string, target: Settings.Target, uri: string | null | coc.Uri | undefined) {
  const actualTarget = resolveTarget(target, uri);
  await Settings.addWordToSettings(actualTarget, word);
  const path = await determineSettingsPath(actualTarget, uri);
  if (path) {
    await CSpellSettings.addWordToSettingsAndUpdate(path, word);
  }
}

export async function addIgnoreWordToTarget(word: string, target: Settings.Target, uri: string | null | coc.Uri | undefined) {
  const actualTarget = resolveTarget(target, uri);
  await Settings.addIgnoreWordToSettings(actualTarget, word);
  const path = await determineSettingsPath(actualTarget, uri);
  if (path) {
    await CSpellSettings.addIgnoreWordToSettingsAndUpdate(path, word);
  }
}

export function removeWordFromWorkspaceDictionary(word: string, uri: string | null | coc.Uri | undefined): Thenable<void> {
  return removeWordFromTarget(word, Settings.Target.Workspace, uri);
}

export function removeWordFromUserDictionary(word: string): Thenable<void> {
  return removeWordFromTarget(word, Settings.Target.Global, undefined);
}

async function removeWordFromTarget(word: string, target: Settings.Target, uri: string | null | coc.Uri | undefined) {
  const actualTarget = resolveTarget(target, uri);
  await Settings.removeWordFromSettings(actualTarget, word);
  const path = await determineSettingsPath(actualTarget, uri);
  if (path) {
    await CSpellSettings.removeWordFromSettingsAndUpdate(path, word);
  }
}

async function determineSettingsPath(
  target: Settings.ConfigTarget,
  uri: string | null | coc.Uri | undefined
): Promise<string | undefined> {
  if (target !== Settings.Target.Global) {
    const useUri = uri ? pathToUri(uri) : undefined;
    return Settings.findExistingSettingsFileLocation(useUri);
  }
  return undefined;
}

function resolveTarget(target: Settings.Target, uri?: string | null | coc.Uri): Settings.ConfigTarget {
  if (target === Settings.Target.Global || !Settings.hasWorkspaceLocation()) {
    return Settings.Target.Global;
  }

  if (!uri) {
    return Settings.Target.Workspace;
  }

  const resolvedUri = pathToUri(uri);
  return Settings.createTargetForUri(target, resolvedUri);
}

export async function enableLanguageId(languageId: string): Promise<void> {
  if (!languageId) {
    languageId = await coc.workspace.requestInput('Input enable language Id', '');
    if (!languageId) {
      return;
    }
  }
  const doc = await coc.workspace.document;
  const uri = doc && doc.textDocument.uri;
  return Settings.enableLanguageIdForClosestTarget(languageId, true, uri ? coc.Uri.parse(uri) : undefined);
}

export async function disableLanguageId(languageId: string): Promise<void> {
  if (!languageId) {
    languageId = await coc.workspace.requestInput('Input disable language Id', '');
    if (!languageId) {
      return;
    }
  }
  const doc = await coc.workspace.document;
  const uri = doc && doc.textDocument.uri;
  return Settings.enableLanguageIdForClosestTarget(languageId, false, uri ? coc.Uri.parse(uri) : undefined);
}

export function userCommandOnCurrentSelectionOrPrompt(
  prompt: string,
  fnAction: (text: string, uri: coc.Uri | undefined) => Thenable<void>
): () => Thenable<void> {
  return async function () {
    const document = await coc.workspace.document;
    const mode = await coc.workspace.nvim.call('visualmode') as string;
    let range = await coc.workspace.getSelectedRange(mode, document);
    let value = range ? document.textDocument.getText(range) : '';
    if (range && !(range.start.line !== range.end.line || range.start.character !== range.end.character)) {
      fnAction(value, coc.Uri.parse(document.textDocument.uri));
    } else {
      const position = await coc.workspace.getCursorPosition();
      if (position && document && document.textDocument) {
        range = document.getWordRangeAtPosition(position);
        value = range ? document.textDocument.getText(range) : '';
      }
      const word = await coc.workspace.requestInput(prompt, value);
      word && fnAction(word, coc.Uri.parse(document.textDocument.uri));
    }
  };
}

function pathToUri(uri: string | coc.Uri): coc.Uri {
  if (uri instanceof coc.Uri) {
    return uri;
  }
  return coc.Uri.parse(uri);
}
