import * as coc from 'coc.nvim';
import {CSpellClient} from './client';
import {ConfigTarget} from './settings';

export interface ExtensionApi {
    registerConfig(path: string): void;
    triggerGetSettings(): void;
    enableLanguageId(languageId: string, uri?: string): Thenable<void>;
    disableLanguageId(languageId: string, uri?: string): Thenable<void>;
    enableCurrentLanguage(): Thenable<void>;
    disableCurrentLanguage(): Thenable<void>;
    addWordToUserDictionary(word: string): Thenable<void>;
    addWordToWorkspaceDictionary(word: string, uri?: string | null | coc.Uri): Thenable<void>;
    enableLocal(target: ConfigTarget, local: string): Thenable<void>;
    disableLocal(target: ConfigTarget, local: string): Thenable<void>;
    updateSettings(): boolean;
    cSpellClient(): CSpellClient;
}
