# brackets-viewer.js
A simple library to display tournament brackets (pools, single elimination, double elimination)

## How to use?

Import the library using [jsDelivr](https://www.jsdelivr.com/):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Drarig29/brackets-viewer.js/dist/brackets-viewer.min.css" />
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/Drarig29/brackets-viewer.js/dist/brackets-viewer.min.js"></script>
```

It'll also be available on npm later.

Now, you can use it like this:

```js
bracketsViewer.render({
    name: "Example",
    type: "double_elimination",
    minorOrdering: ['reverse', 'pair_flip', 'reverse', 'natural'],
    teams: [
        "Team 1", "Team 2",
        "Team 3", "Team 4",
        "Team 5", "Team 6",
        "Team 7", "Team 8",
        "Team 9", "Team 10",
        "Team 11", "Team 12",
        "Team 13", "Team 14",
        "Team 15", "Team 16",
    ],
    results: [[ /* Winner Bracket */
        [[1, 5], [2, 4], [6, 3], [2, 3], [1, 5], [5, 3], [7, 2], [1, 2]],
        [[1, 2], [3, 4], [5, 6], [7, 8]],
        [[9, 1], [8, 2]],
        [[1, 3]],
    ], [        /* Loser Bracket */
        [[5, 1], [1, 2], [3, 2], [6, 9]],
        [[8, 2], [1, 2], [6, 2], [1, 3]],
        [[1, 2], [3, 1]],
        [[3, 0], [1, 9]],
        [[3, 2]],
        [[4, 2]],
    ], [        /* Grand Final */
        [[2, 1]],
    ]],
})

```

See `index.html` in the demo folder for examples.

## How to build?

Install all npm dependencies:

```bash
npm install
```

Build with webpack:

```bash
npm run build
```
