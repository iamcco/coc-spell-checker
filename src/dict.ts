import * as vim from 'cspell-dict-vimlang';

import {ExtensionApi} from './extensionApi';

// enable default dict
const dicts  = [
  vim
];

export function activateDict(api: ExtensionApi) {
  dicts.forEach(dict => {
    const path = dict.getConfigLocation();
    // We need to register the dictionary configuration with the Code Spell Checker Extension
    api && api.registerConfig && api.registerConfig(path);
  });
}
