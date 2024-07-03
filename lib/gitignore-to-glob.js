/**
 * gitignore-to-glob
 * https://github.com/sociation/gitignore-to-glob
 *
 * Author Ilya Bolotin
 * based on code of Michał Gołębiowski <m.goleb@gmail.com>
 * Licensed under the MIT license.
 */

'use strict';

import fs from 'fs';
import path from 'path';

const loadGitignoreContents = (pathOrContents, isContents) => {
    if (isContents) {
        return pathOrContents;
    }

    const gitignorePath = path.resolve(pathOrContents || '.gitignore');
    return fs.readFileSync(gitignorePath, 'utf8');
};

export default (gitignore, options = {}) => {
    let dirsToCheck;
    let gitignoreIsInMemoryString = false;

    if (Array.isArray(options)) {
        dirsToCheck = options;
    } else {
        ({ dirsToCheck, string: gitignoreIsInMemoryString } = options);
    }

    const gitignoreContents = loadGitignoreContents(gitignore, gitignoreIsInMemoryString);

    return gitignoreContents
        .split('\n')
        .filter(pattern => pattern && pattern[0] !== '#')
        .map(pattern => pattern.startsWith('!') ? ['', pattern.slice(1)] : ['!', pattern])
        .filter(([, pattern]) => !pattern.includes('/.') && !pattern.startsWith('.'))
        .filter(([, pattern]) => 
            !pattern.startsWith('/') || !dirsToCheck ||
            new RegExp(`^/(?:${dirsToCheck.join('|')})(?:/|$)`).test(pattern)
        )
        .map(([flag, pattern]) => 
            !pattern.startsWith('/')
                ? [flag, `${dirsToCheck ? `{${dirsToCheck.join(',')}}/` : ''}**/${pattern}`]
                : [flag, pattern.slice(1)]
        )
        .flatMap(([flag, pattern]) => {
            const fullPattern = `${flag}${pattern}`;
            return pattern.endsWith('/')
                ? [fullPattern.slice(0, -1), `${fullPattern}**`]
                : [fullPattern, `${fullPattern}/**`];
        });
};
