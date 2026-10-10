# Paircode

Paircode is a static JavaScript coding-challenge site for GitHub Pages. The
login and participant data currently use browser-only demo storage.

## Add a published question

1. Create `questions/<id>.json` using the fields documented in
   [questions/README.md](./questions/README.md).
2. Create `test-cases/<id>.json` with the input/expected-output pairs.
3. Add `<id>` to `questions/index.json`.
4. Preview the site locally, then commit and push all three files. GitHub Pages
   will serve the new challenge after its deployment finishes.

The question form in the site creates a draft in the current browser; it does
not write a repository file. Use the JSON files for questions that should be
published to participants.

## Archive a participant submission

Open **Submissions**, expand the saved entry, and select **Download for GitHub**.
Move the downloaded JSON file into `submissions/`, then commit and push it from
VS Code. GitHub Pages is static hosting and cannot accept file writes from the
browser.

The current demo login is not authentication. Challenge drafts, code, progress,
and submissions stay in the current browser unless a submission is manually
exported and committed. Do not put passwords, access tokens, or other secrets in
these files or in the public repository.

## C and C++ execution

The editor runs JavaScript in a browser worker. C and C++ are compiled and run
by the public [Wandbox](https://wandbox.org/) compiler API, so no API key is
needed. Every C/C++ run sends the participant's source code and each test
input to Wandbox. Do not submit sensitive code. Wandbox is a shared public
service and may apply rate limits or be unavailable; it is not a guaranteed
production backend.

For C/C++ test cases, flat arrays are sent as whitespace-separated values
(`[2, 7]` becomes `2 7`), strings are sent as-is, and other values are sent
as JSON. Read each case from standard input and print the expected result to
standard output. Output that is valid JSON is compared as a JSON value;
otherwise, trimmed output is compared as text. Each test case is compiled and
run separately.

For example, the `Sum Two Numbers` challenge can be solved in C++ with:

```cpp
#include <iostream>

int main() {
  double first, second;
  if (!(std::cin >> first >> second)) return 1;
  std::cout << first + second;
  return 0;
}
```
