/**
 * gitignore-to-glob
 * https://github.com/EE/gitignore-to-glob
 *
 * Author Michał Gołębiowski <m.goleb@gmail.com>
 * Licensed under the MIT license.
 */

import fs from 'fs/promises';
import path from 'path';

const loadGitignoreContents = async (pathOrContents, isContents) => {
    if (isContents) {
        return pathOrContents;
    }

    const gitignorePath = path.resolve(pathOrContents || '.gitignore');
    return await fs.readFile(gitignorePath, 'utf8');
};

export default async (gitignore, options = {}) => {
    let dirsToCheck;
    let gitignoreIsInMemoryString = false;

    if (Array.isArray(options)) {
        dirsToCheck = options;
    } else {
        ({ dirsToCheck, string: gitignoreIsInMemoryString } = options);
    }

    const gitignoreContents = await loadGitignoreContents(gitignore, gitignoreIsInMemoryString);

    return gitignoreContents
        .split('\n')
        .filter(pattern => pattern && pattern[0] !== '#')
        .map(pattern => pattern[0] === '!' ? ['', pattern.slice(1)] : ['!', pattern])
        .filter(([, pattern]) => !pattern.includes('/.') && !pattern.startsWith('.'))
        .filter(([, pattern]) => 
            pattern[0] !== '/' || !dirsToCheck ||
            new RegExp(`^/(?:${dirsToCheck.join('|')})(?:/|$)`).test(pattern)
        )
        .map(([flag, pattern]) => 
            pattern[0] !== '/'
                ? [flag, `${dirsToCheck ? `{${dirsToCheck}}/` : ''}**/${pattern}`]
                : [flag, pattern.slice(1)]
        )
        .flatMap(([flag, pattern]) => {
            const fullPattern = `${flag}${pattern}`;
            return pattern.endsWith('/')
                ? [fullPattern.slice(0, -1), `${fullPattern}**`]
                : [fullPattern, `${fullPattern}/**`];
        });
};
