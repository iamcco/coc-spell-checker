"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator = require("./validator");
const loremIpsum = require("lorem-ipsum");
const cspell = require("cspell-lib");
const vscode_uri_1 = require("vscode-uri");
const cspell_lib_1 = require("cspell-lib");
const vscode_languageserver_1 = require("vscode-languageserver");
// cSpell:ignore brouwn jumpped lazzy wrongg mispelled ctrip nmove mischecked
const defaultSettings = Object.assign(Object.assign({}, cspell_lib_1.getDefaultSettings()), { enabledLanguageIds: ['plaintext', 'javascript'] });
function getSettings(text, languageId) {
    return cspell.constructSettingsForText(defaultSettings, text, languageId);
}
describe('Validator', () => {
    test('validates the validator', () => {
        const text = 'The quick brouwn fox jumpped over the lazzy dog.';
        const languageId = 'plaintext';
        const settings = getSettings(text, languageId);
        const results = Validator.validateText(text, settings);
        return results.then(results => {
            const words = results.map(({ text }) => text);
            expect(words).toEqual(['brouwn', 'jumpped', 'lazzy']);
        });
    });
    test('validates ignore Case', () => {
        const text = 'The Quick brown fox Jumped over the lazy dog.';
        const languageId = 'plaintext';
        const settings = getSettings(text, languageId);
        const results = Validator.validateText(text, settings);
        return results.then(results => {
            const words = results.map(({ text }) => text);
            expect(words).toEqual([]);
        });
    });
    test('validate limit', () => {
        const text = loremIpsum({ count: 5, units: 'paragraphs' });
        const languageId = 'plaintext';
        const settings = Object.assign(Object.assign({}, getSettings(text, languageId)), { maxNumberOfProblems: 10 });
        const results = Validator.validateText(text, settings);
        return results.then(results => expect(results).toHaveLength(10));
    });
    test('validates reserved words', () => {
        const text = 'constructor const prototype type typeof null undefined';
        const languageId = 'javascript';
        const settings = Object.assign(Object.assign({}, getSettings(text, languageId)), { maxNumberOfProblems: 10 });
        const results = Validator.validateText(text, settings);
        return results.then(results => expect(results).toHaveLength(0));
    });
    test('validates regex inclusions/exclusions', async () => {
        const text = sampleCode;
        const languageId = 'plaintext';
        const settings = Object.assign(Object.assign({}, getSettings(text, languageId)), { maxNumberOfProblems: 10 });
        const results = await Validator.validateText(text, settings);
        const words = results.map(wo => wo.text);
        expect(words).toEqual(expect.arrayContaining(['wrongg']));
        expect(words).toEqual(expect.arrayContaining(['mispelled']));
        expect(words).toEqual(expect.not.arrayContaining(['xaccd']));
        expect(words).toEqual(expect.not.arrayContaining(['ctrip']));
        expect(words).toEqual(expect.not.arrayContaining(['FFEE']));
        expect(words).toEqual(expect.not.arrayContaining(['nmove']));
    });
    test('validates ignoreRegExpList', () => {
        const text = sampleCode;
        const languageId = 'plaintext';
        const settings = Object.assign(Object.assign({}, getSettings(text, languageId)), { maxNumberOfProblems: 10, ignoreRegExpList: ['^const [wy]RON[g]+', 'mis.*led'] });
        const results = Validator.validateText(text, settings);
        return results.then(results => {
            const words = results.map(wo => wo.text);
            expect(words).toEqual(expect.not.arrayContaining(['wrongg']));
            expect(words).toEqual(expect.not.arrayContaining(['mispelled']));
            expect(words).toEqual(expect.arrayContaining(['mischecked']));
        });
    });
    test('validates ignoreRegExpList 2', () => {
        const results = Validator.validateText(sampleCode, { ignoreRegExpList: ['/^const [wy]ron[g]+/gim', '/MIS...LED/g', '/mischecked'] });
        return results.then(results => {
            const words = results.map(wo => wo.text);
            expect(words).toEqual(expect.not.arrayContaining(['wrongg']));
            expect(words).toEqual(expect.arrayContaining(['mispelled']));
            expect(words).toEqual(expect.arrayContaining(['mischecked']));
        });
    });
    test('validates malformed ignoreRegExpList', () => {
        const results = Validator.validateText(sampleCode, { ignoreRegExpList: ['/wrong[/gim', 'mis.*led'] });
        return results.then(results => {
            const words = results.map(wo => wo.text);
            expect(words).toEqual(expect.arrayContaining(['wrongg']));
            expect(words).toEqual(expect.not.arrayContaining(['mispelled']));
            expect(words).toEqual(expect.arrayContaining(['mischecked']));
        });
    });
    test('validateTextDocument', async () => {
        const text = sampleCode;
        const languageId = 'plaintext';
        const settings = Object.assign(Object.assign({}, getSettings(text, languageId)), { maxNumberOfProblems: 10 });
        const uri = vscode_uri_1.URI.file(__filename).toString();
        const textDoc = vscode_languageserver_1.TextDocument.create(uri, languageId, 1, text);
        const results = await Validator.validateTextDocument(textDoc, settings);
        const words = results.map(diag => diag.message);
        expect(words).toEqual(expect.arrayContaining([expect.stringContaining('wrongg')]));
        expect(words).toEqual(expect.arrayContaining([expect.stringContaining('mispelled')]));
        expect(words).toEqual(expect.not.arrayContaining([expect.stringContaining('xaccd')]));
        expect(words).toEqual(expect.not.arrayContaining([expect.stringContaining('ctrip')]));
        expect(words).toEqual(expect.not.arrayContaining([expect.stringContaining('FFEE')]));
        expect(words).toEqual(expect.not.arrayContaining([expect.stringContaining('nmove')]));
    });
});
const sampleCode = `

// Verify urls do not get checked.
const url = 'http://ctrip.com?q=words';

// Verify hex values.
const value = 0xaccd;

/* spell-checker:disable */

const weirdWords = ['ctrip', 'xebia', 'zando', 'zooloo'];

/* spell-checker:enable */

const wrongg = 'mispelled';
const check = 'mischecked';
const message = "\\nmove to next line";

const hex = 0xBADC0FFEE;

`;
//# sourceMappingURL=validator.test.js.map