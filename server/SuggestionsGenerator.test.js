"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cspell = require("cspell-lib");
const SuggestionsGenerator_1 = require("./SuggestionsGenerator");
describe('Validate Suggestions', () => {
    test('genWordSuggestions', async () => {
        const gen = new SuggestionsGenerator_1.SuggestionGenerator(getSettings);
        const doc = { languageId: 'typescript', text: '' };
        const { settings } = await getSettings(doc);
        const result = await gen.genWordSuggestions(doc, 'code');
        expect(result).toContain('code');
        expect(result).toHaveLength(settings.numSuggestions || 0);
    });
    test('genWordSuggestions for long words', async () => {
        const gen = new SuggestionsGenerator_1.SuggestionGenerator(getSettings);
        const doc = { languageId: 'typescript', text: '' };
        const result = await gen.genWordSuggestions(doc, 'Acknowledgements');
        expect(result).toHaveLength(SuggestionsGenerator_1.maxNumberOfSuggestionsForLongWords);
        expect(result).toContain('acknowledgements');
    });
    async function getSettings(doc) {
        const settings = await cspell.constructSettingsForText(cspell.getDefaultSettings(), doc.text || '', doc.languageId);
        const dictionary = await cspell.getDictionary(settings);
        return { settings, dictionary };
    }
});
//# sourceMappingURL=SuggestionsGenerator.test.js.map