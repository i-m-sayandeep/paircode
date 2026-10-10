# Questions

Add one `question-id.json` file here for each published challenge. Add its test
cases to `../test-cases/question-id.json`, then add `question-id` to `index.json`.

Use a lowercase ID containing letters, numbers, and hyphens. The ID must match
the question filename and the test-case filename.

Question JSON fields:

- `id`, `title`, `difficulty` (`Easy`, `Medium`, or `Hard`), `topic`
- `shortDescription`, `description`, `body`
- `notes` (an array of strings)
- `starterCode` (a JavaScript function named `solution(input)`)

Example test-case JSON:

```json
[
  { "input": [2, 7], "expected": 9 },
  { "input": [-3, 5], "expected": 2 }
]
```

The app loads published questions and test cases from these files when hosted
over HTTP(S). Local browser drafts remain on that browser and do not replace
these repository files.
