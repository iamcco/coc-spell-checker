import { performance, toMilliseconds } from './util/perf';
performance.mark('cspell_start_extension');
import * as path from 'path';
performance.mark('import 1');
import {setEnableSpellChecking} from './settings';
performance.mark('import 2');
import * as settings from './settings';
performance.mark('import 3');
performance.mark('import 4');
import {CSpellClient} from './client';
performance.mark('import 5');

import { ExtensionContext } from 'coc.nvim';
performance.mark('import 6');
import * as coc from 'coc.nvim';
performance.mark('import 7');

import { initStatusBar } from './statusbar';
performance.mark('import 8');

import {userCommandOnCurrentSelectionOrPrompt, handlerApplyTextEdits} from './commands';
performance.mark('import 9');
import * as commands from './commands';
performance.mark('import 10');

// import * as settingsViewer from './infoViewer/infoView';
import { ExtensionApi } from './extensionApi';

performance.mark('cspell_done_import');

export async function activate(context: ExtensionContext): Promise<ExtensionApi> {
    performance.mark('cspell_activate_start');

    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));

    // Get the cSpell Client
    const client = await CSpellClient.create(serverModule);
    // Start the client.
    const clientDispose = client.start();

    function triggerGetSettings() {
        client.triggerSettingsRefresh();
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

    function dumpPerfTimeline() {
        performance.getEntries().forEach(entry => {
            console.log(entry.name, toMilliseconds(entry.startTime), entry.duration);
        });
    }

    const actionAddWordToFolder = userCommandOnCurrentSelectionOrPrompt(
        'Add Word to Folder Dictionary',
        splitTextFn(commands.addWordToFolderDictionary)
    );
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
    const actionAddIgnoreWordToFolder = userCommandOnCurrentSelectionOrPrompt(
        'Ignore Word in Folder Settings',
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

    const actionRemoveWordFromFolderDictionary = userCommandOnCurrentSelectionOrPrompt(
        'Remove Word from Dictionary',
        splitTextFn(commands.removeWordFromFolderDictionary)
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
        coc.commands.registerCommand('cSpell.editText', handlerApplyTextEdits(client.client)),

        coc.commands.registerCommand('cSpell.addWordToDictionarySilent', commands.addWordToFolderDictionary),
        coc.commands.registerCommand('cSpell.addWordToWorkspaceDictionarySilent', commands.addWordToWorkspaceDictionary),
        coc.commands.registerCommand('cSpell.addWordToUserDictionarySilent', commands.addWordToUserDictionary),

        coc.commands.registerCommand('cSpell.addWordToDictionary', actionAddWordToFolder),
        coc.commands.registerCommand('cSpell.addWordToWorkspaceDictionary', actionAddWordToWorkspace),
        coc.commands.registerCommand('cSpell.addWordToUserDictionary', actionAddWordToDictionary),

        coc.commands.registerCommand('cSpell.addIgnoreWord', actionAddIgnoreWord),
        coc.commands.registerCommand('cSpell.addIgnoreWordToFolder', actionAddIgnoreWordToFolder),
        coc.commands.registerCommand('cSpell.addIgnoreWordToWorkspace', actionAddIgnoreWordToWorkspace),
        coc.commands.registerCommand('cSpell.addIgnoreWordToUser', actionAddIgnoreWordToUser),

        coc.commands.registerCommand('cSpell.removeWordFromFolderDictionary', actionRemoveWordFromFolderDictionary),
        coc.commands.registerCommand('cSpell.removeWordFromWorkspaceDictionary', actionRemoveWordFromWorkspaceDictionary),
        coc.commands.registerCommand('cSpell.removeWordFromUserDictionary', actionRemoveWordFromDictionary),

        coc.commands.registerCommand('cSpell.enableLanguage', commands.enableLanguageId),
        coc.commands.registerCommand('cSpell.disableLanguage', commands.disableLanguageId),
        coc.commands.registerCommand('cSpell.enableForWorkspace', () => setEnableSpellChecking(settings.Target.Workspace, false)),
        coc.commands.registerCommand('cSpell.disableForWorkspace', () => setEnableSpellChecking(settings.Target.Workspace, false)),
        coc.commands.registerCommand('cSpell.toggleEnableSpellChecker', commands.toggleEnableSpellChecker),
        coc.commands.registerCommand('cSpell.enableCurrentLanguage', commands.enableCurrentLanguage),
        coc.commands.registerCommand('cSpell.disableCurrentLanguage', commands.disableCurrentLanguage),
        coc.commands.registerCommand('cSpell.logPerfTimeline', dumpPerfTimeline),
        settings.watchSettingsFiles(triggerGetSettings),
    );

    // infoViewer.activate(context, client);
    // settingsViewer.activate(context, client);

    function registerConfig(path: string) {
        client.registerConfiguration(path);
    }

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

    performance.mark('cspell_activate_end');
    performance.measure('cspell_activation', 'cspell_activate_start', 'cspell_activate_end');
    return server;
}
performance.mark('cspell_done_load');
