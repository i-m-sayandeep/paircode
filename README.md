# Paircode

Paircode is a static JavaScript coding-challenge site for GitHub Pages.

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
