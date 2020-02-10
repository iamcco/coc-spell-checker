import * as coc from 'coc.nvim';

import * as path from 'path';
import * as settings from './settings';
import {CSpellClient} from './client';
import { initStatusBar } from './statusbar';
import {userCommandOnCurrentSelectionOrPrompt, handlerApplyTextEdits} from './commands';
import * as commands from './commands';
import { ExtensionApi } from './extensionApi';
import {activateDict} from './dict';

export async function activate(context: coc.ExtensionContext): Promise<ExtensionApi> {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));

  // Get the cSpell Client
  const client = await CSpellClient.create(serverModule);
  // Start the client.
  const clientDispose = client.start();

  function triggerGetSettings() {
    client.triggerSettingsRefresh();
  }

  function registerConfig(path: string) {
    client.registerConfiguration(path);
  }

  function splitTextFn(
    apply: (word: string, uri: string | coc.Uri | null | undefined) => Thenable<void>
  ): (word: string, uri: string | coc.Uri | null | undefined) => Thenable<void> {
    return async (word: string, uri: string | coc.Uri | null | undefined) => {
      const doc = await coc.workspace.document;
      const document = doc && doc.textDocument;
      const uriToUse = uri || document && document.uri || null;
      return client.splitTextIntoDictionaryWords(word)
        .then(result => result.words)
        .then(words => apply(words.join(' '), uriToUse));
    };
  }

  const actionAddWordToWorkspace = userCommandOnCurrentSelectionOrPrompt(
    'Add Word to Workspace Dictionary',
    splitTextFn(commands.addWordToWorkspaceDictionary)
  );
  const actionAddWordToDictionary = userCommandOnCurrentSelectionOrPrompt(
    'Add Word to User Dictionary',
    splitTextFn(commands.addWordToUserDictionary)
  );

  const actionAddIgnoreWord = userCommandOnCurrentSelectionOrPrompt(
    'Ignore Word',
    splitTextFn((word, uri) => commands.addIgnoreWordToTarget(word, settings.Target.Workspace, uri))
  );
  const actionAddIgnoreWordToWorkspace = userCommandOnCurrentSelectionOrPrompt(
    'Ignore Word in Workspace Settings',
    splitTextFn((word, uri) => commands.addIgnoreWordToTarget(word, settings.Target.Workspace, uri))
  );
  const actionAddIgnoreWordToUser = userCommandOnCurrentSelectionOrPrompt(
    'Ignore Word in User Settings',
    splitTextFn((word, uri) => commands.addIgnoreWordToTarget(word, settings.Target.Global, uri))
  );

  const actionRemoveWordFromWorkspaceDictionary = userCommandOnCurrentSelectionOrPrompt(
    'Remove Word from Dictionary',
    splitTextFn(commands.removeWordFromWorkspaceDictionary)
  );
  const actionRemoveWordFromDictionary = userCommandOnCurrentSelectionOrPrompt(
    'Remove Word from Dictionary',
    splitTextFn(commands.removeWordFromUserDictionary)
  );

  initStatusBar(context, client);

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(
    clientDispose,
    // internal commands that server uses
    coc.commands.registerCommand('cSpell.editText', handlerApplyTextEdits(client.client), null, true),
    coc.commands.registerCommand('cSpell.addWordToDictionarySilent', commands.addWordToWorkspaceDictionary, null, true),
    coc.commands.registerCommand('cSpell.addWordToWorkspaceDictionarySilent', commands.addWordToWorkspaceDictionary, null, true),
    coc.commands.registerCommand('cSpell.addWordToUserDictionarySilent', commands.addWordToUserDictionary, null, true),

    coc.commands.registerCommand('cSpell.addWordToDictionary', actionAddWordToWorkspace),
    coc.commands.registerCommand('cSpell.addWordToWorkspaceDictionary', actionAddWordToWorkspace),
    coc.commands.registerCommand('cSpell.addWordToUserDictionary', actionAddWordToDictionary),

    coc.commands.registerCommand('cSpell.addIgnoreWord', actionAddIgnoreWord),
    coc.commands.registerCommand('cSpell.addIgnoreWordToFolder', actionAddIgnoreWordToWorkspace),
    coc.commands.registerCommand('cSpell.addIgnoreWordToWorkspace', actionAddIgnoreWordToWorkspace),
    coc.commands.registerCommand('cSpell.addIgnoreWordToUser', actionAddIgnoreWordToUser),

    coc.commands.registerCommand('cSpell.removeWordFromFolderDictionary', actionRemoveWordFromWorkspaceDictionary),
    coc.commands.registerCommand('cSpell.removeWordFromWorkspaceDictionary', actionRemoveWordFromWorkspaceDictionary),
    coc.commands.registerCommand('cSpell.removeWordFromUserDictionary', actionRemoveWordFromDictionary),

    coc.commands.registerCommand('cSpell.enableLanguage', commands.enableLanguageId),
    coc.commands.registerCommand('cSpell.disableLanguage', commands.disableLanguageId),
    coc.commands.registerCommand('cSpell.enableForWorkspace', () => settings.setEnableSpellChecking(settings.Target.Workspace, false)),
    coc.commands.registerCommand('cSpell.disableForWorkspace', () => settings.setEnableSpellChecking(settings.Target.Workspace, false)),
    coc.commands.registerCommand('cSpell.toggleEnableSpellChecker', commands.toggleEnableSpellChecker),
    coc.commands.registerCommand('cSpell.enableCurrentLanguage', commands.enableCurrentLanguage),
    coc.commands.registerCommand('cSpell.disableCurrentLanguage', commands.disableCurrentLanguage),
    settings.watchSettingsFiles(triggerGetSettings),
  );

  const server = {
    registerConfig,
    triggerGetSettings,
    enableLanguageId: commands.enableLanguageId,
    disableLanguageId: commands.disableLanguageId,
    enableCurrentLanguage: commands.enableCurrentLanguage,
    disableCurrentLanguage: commands.disableCurrentLanguage,
    addWordToUserDictionary: commands.addWordToUserDictionary,
    addWordToWorkspaceDictionary: commands.addWordToWorkspaceDictionary,
    enableLocal: settings.enableLocal,
    disableLocal: settings.disableLocal,
    updateSettings: () => false,
    cSpellClient: () => client,
  };

  // activate default dicts
  activateDict(server);

  return server;
}
