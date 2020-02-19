import * as cspell from 'cspell-lib';
export { LanguageSetting, DictionaryDefinition } from 'cspell-lib';
export interface SpellCheckerSettings {
    checkLimit?: number;
    diagnosticLevel?: string;
    allowedSchemas?: string[];
    logLevel?: 'None' | 'Error' | 'Warning' | 'Information' | 'Debug';
    showStatus?: boolean;
    spellCheckDelayMs?: number;
    showCommandsInEditorContextMenu?: boolean;
}
export interface CSpellUserSettingsWithComments extends cspell.CSpellUserSettingsWithComments, SpellCheckerSettings {
}
export interface CSpellUserSettings extends cspell.CSpellSettings, SpellCheckerSettings {
}
