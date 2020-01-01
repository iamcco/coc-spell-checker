import * as config from './cspellConfig';
export interface GetConfigurationForDocumentResult {
    languageEnabled: boolean | undefined;
    fileEnabled: boolean | undefined;
    settings: config.CSpellUserSettings | undefined;
    docSettings: config.CSpellUserSettings | undefined;
}
export interface IsSpellCheckEnabledResult {
    languageEnabled: boolean | undefined;
    fileEnabled: boolean | undefined;
}
export interface SplitTextIntoWordsResult {
    words: string[];
}
export interface SpellingSuggestionsResult {
}
export interface TextDocumentInfo {
    uri?: string;
    languageId?: string;
    text?: string;
}
export declare type ServerRequestMethods = keyof ServerMethodRequestResult;
export declare type ServerRequestMethodConstants = {
    [key in ServerRequestMethods]: key;
};
declare type ServerRequestResult<Req, Res> = {
    request: Req;
    result: Res;
};
export declare type ServerMethodRequestResult = {
    getConfigurationForDocument: ServerRequestResult<TextDocumentInfo, GetConfigurationForDocumentResult>;
    isSpellCheckEnabled: ServerRequestResult<TextDocumentInfo, IsSpellCheckEnabledResult>;
    splitTextIntoWords: ServerRequestResult<string, SplitTextIntoWordsResult>;
    spellingSuggestions: ServerRequestResult<TextDocumentInfo, SpellingSuggestionsResult>;
};
export declare type ServerRequestMethodResults = {
    [key in keyof ServerMethodRequestResult]: ServerMethodRequestResult[key]['result'];
};
export declare type ServerRequestMethodRequests = {
    [key in keyof ServerMethodRequestResult]: ServerMethodRequestResult[key]['request'];
};
export declare type NotifyServerMethods = 'onConfigChange' | 'registerConfigurationFile';
export declare type NotifyServerMethodConstants = {
    [key in NotifyServerMethods]: NotifyServerMethods;
};
export {};
