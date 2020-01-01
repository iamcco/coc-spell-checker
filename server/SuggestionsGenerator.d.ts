import { CSpellUserSettings } from './cspellConfig';
import { SuggestionResult } from 'cspell-lib';
import { SpellingDictionaryCollection } from 'cspell-lib/dist/SpellingDictionary';
export declare const maxWordLengthForSuggestions = 20;
export declare const wordLengthForLimitingSuggestions = 15;
export declare const maxNumberOfSuggestionsForLongWords = 1;
export interface GetSettingsResult {
    settings: CSpellUserSettings;
    dictionary: SpellingDictionaryCollection;
}
export declare class SuggestionGenerator<DocInfo> {
    readonly getSettings: (doc: DocInfo) => GetSettingsResult | Promise<GetSettingsResult>;
    constructor(getSettings: (doc: DocInfo) => GetSettingsResult | Promise<GetSettingsResult>);
    genSuggestions(doc: DocInfo, word: string): Promise<SuggestionResult[]>;
    genWordSuggestions(doc: DocInfo, word: string): Promise<string[]>;
}
