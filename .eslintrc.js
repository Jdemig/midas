module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        // Many times we use snake case for data properties.  Therefore, we don't want to
        // enforce camelcase.
        camelcase: 'off',

        'declaration-colon-newlin-after': 'off',

        'max-len': [1, 150, 2, { ignoreComments: true }],

        'no-console': 'off',

        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],

        'no-underscore-dangle': [
            'error',
            {
                // Add/remove allowed member names as necessary.
                allow: ['__filename', '_getCss', '_id', '_insertCss'],
                allowAfterSuper: true,
                allowAfterThis: true,
            },
        ],
    }
};