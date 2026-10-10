const STORAGE_KEY = "paircode-challenges-v1";
const SUBMISSIONS_STORAGE_KEY = "paircode-submissions-v1";
const LOGIN_SESSION_KEY = "paircode-demo-login";
const WANDBOX_API_URL = "https://wandbox.org/api/compile.json";
const LANGUAGE_OPTIONS = {
  javascript: { label: "JavaScript", extension: "js", badge: "JS" },
  c: { label: "C", extension: "c", badge: "C" },
  cpp: { label: "C++", extension: "cpp", badge: "C++" },
};
const STARTER_CODE = `function solution(input) {
  // Write your solution here
  
}

// Try it with the test cases on the right`;
const COMPILED_STARTER_CODE = {
  c: `#include <stdio.h>

int main(void) {
  // Read the test input from stdin and print your answer.
  return 0;
}`,
  cpp: `#include <iostream>

int main() {
  // Read the test input from std::cin and print your answer.
  return 0;
}`,
};

const starterChallenges = [
  {
    id: "sum-two-numbers",
    title: "Sum Two Numbers",
    difficulty: "Easy",
    topic: "Warm-up",
    shortDescription: "A little warm-up to get your coding session started.",
    description: "Given an array of two numbers, return their sum.",
    body: "Write a function that takes an array containing two numbers and returns their sum.\n\nYour function will receive the input as a single argument, and should return a number.",
    notes: ["The input will always contain exactly two numbers.", "Numbers may be negative or decimals."],
    tests: [
      { input: [2, 7], expected: 9 },
      { input: [-3, 5], expected: 2 },
      { input: [12.5, 0.5], expected: 13 },
    ],
    code: STARTER_CODE,
  },
  {
    id: "reverse-a-string",
    title: "Reverse a String",
    difficulty: "Easy",
    topic: "Strings",
    shortDescription: "Turn a string around, one character at a time.",
    description: "Given a string, return a new string with its characters in reverse order.",
    body: "Create a function that takes one string and returns the same characters in reverse order.\n\nDo not modify the original input.",
    notes: ["The input will always be a string.", "An empty string should return an empty string."],
    tests: [
      { input: "hello", expected: "olleh" },
      { input: "paircode", expected: "edocriap" },
      { input: "", expected: "" },
    ],
    code: `function solution(input) {
  // Return the input string in reverse
  
}

// Try it with the test cases on the right`,
  },
  {
    id: "find-the-maximum",
    title: "Find the Maximum",
    difficulty: "Medium",
    topic: "Arrays",
    shortDescription: "Find the biggest number without losing your cool.",
    description: "Given an array of numbers, return the largest value in the array.",
    body: "Write a function that finds and returns the largest number from a non-empty array of numbers.\n\nYour solution should work for both positive and negative values.",
    notes: ["The array will contain at least one number.", "The input values will be valid numbers."],
    tests: [
      { input: [3, 9, 2, 11, 4], expected: 11 },
      { input: [-8, -2, -13], expected: -2 },
      { input: [42], expected: 42 },
    ],
    code: `function solution(input) {
  // Return the largest number in the array
  
}

// Try it with the test cases on the right`,
  },
];

const elements = {
  challengeList: document.querySelector("#challenge-list"),
  challengeCount: document.querySelector("#challenge-count"),
  title: document.querySelector("#problem-title"),
  description: document.querySelector("#problem-description"),
  tags: document.querySelector("#problem-tags"),
  body: document.querySelector("#problem-body"),
  examples: document.querySelector("#examples-list"),
  notes: document.querySelector("#notes-list"),
  code: document.querySelector("#code-editor"),
  language: document.querySelector("#language-select"),
  languageBadge: document.querySelector("#language-badge"),
  editorFilename: document.querySelector("#editor-filename"),
  editorLanguageStatus: document.querySelector("#editor-language-status"),
  compilerNotice: document.querySelector("#compiler-notice"),
  lineNumbers: document.querySelector("#line-numbers"),
  syntaxHighlight: document.querySelector("#syntax-highlight-content"),
  results: document.querySelector("#results-content"),
  caseCount: document.querySelector("#case-count"),
  resultSummary: document.querySelector("#result-summary"),
  runButton: document.querySelector("#run-button"),
  cursorLine: document.querySelector("#cursor-line"),
  cursorColumn: document.querySelector("#cursor-column"),
  questionModal: document.querySelector("#question-modal"),
  caseModal: document.querySelector("#case-modal"),
  questionForm: document.querySelector("#question-form"),
  caseForm: document.querySelector("#case-form"),
  questionTests: document.querySelector("#new-question-tests"),
  progressButton: document.querySelector("#progress-button"),
  submissionsButton: document.querySelector("#submissions-button"),
  progressCount: document.querySelector("#progress-count"),
  submissionCount: document.querySelector("#submission-count"),
  progressModal: document.querySelector("#progress-modal"),
  progressList: document.querySelector("#progress-list"),
  progressPercentage: document.querySelector("#progress-percentage"),
  progressHeadline: document.querySelector("#progress-headline"),
  progressBar: document.querySelector("#progress-bar"),
  progressRing: document.querySelector("#progress-ring"),
  submissionsModal: document.querySelector("#submissions-modal"),
  submissionList: document.querySelector("#submission-list"),
  submitButton: document.querySelector("#submit-button"),
  toast: document.querySelector("#toast"),
};

let challenges = loadChallenges();
let submissions = loadSubmissions();
const sharedChallenge = readSharedChallenge();
if (sharedChallenge) {
  const savedShared = challenges.find((challenge) => challenge.id === sharedChallenge.id);
  sharedChallenge.code = savedShared?.code || sharedChallenge.code;
  challenges = challenges.filter((challenge) => challenge.id !== sharedChallenge.id);
  challenges.push(sharedChallenge);
}
let activeChallengeId = sharedChallenge?.id || challenges[0].id;
let activeLanguage = "javascript";
let toastTimer;

try {
  if (localStorage.getItem(LOGIN_SESSION_KEY) !== "1" && sessionStorage.getItem(LOGIN_SESSION_KEY) !== "1") {
    window.location.replace(new URL("index.html", window.location.href));
  }
} catch (error) {
  console.warn("Could not read the demo login session:", error);
}

function loadChallenges() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length > 0) {
      const defaults = new Map(starterChallenges.map((challenge) => [challenge.id, challenge]));
      return saved.map((challenge) => ({ ...defaults.get(challenge.id), ...challenge }));
    }
  } catch (error) {
    console.warn("Could not load saved challenges:", error);
  }
  return starterChallenges.map((challenge) => structuredClone(challenge));
}

async function loadPublishedQuestions() {
  if (!["http:", "https:"].includes(window.location.protocol)) return;
  try {
    const indexResponse = await fetch(new URL("questions/index.json", window.location.href));
    if (!indexResponse.ok) throw new Error(`Question index request failed (${indexResponse.status}).`);
    const ids = await indexResponse.json();
    if (
      !Array.isArray(ids) ||
      ids.some((id) => typeof id !== "string" || !/^[a-z0-9-]{1,80}$/i.test(id)) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error("questions/index.json must be an array of valid question IDs.");
    }
    const published = await Promise.all(ids.map(async (id) => {
      const [questionResponse, testsResponse] = await Promise.all([
        fetch(new URL(`questions/${id}.json`, window.location.href)),
        fetch(new URL(`test-cases/${id}.json`, window.location.href)),
      ]);
      if (!questionResponse.ok || !testsResponse.ok) {
        throw new Error(`Could not load question "${id}" and its test cases.`);
      }
      const [question, tests] = await Promise.all([questionResponse.json(), testsResponse.json()]);
      if (
        question.id !== id ||
        typeof question.title !== "string" ||
        typeof question.description !== "string" ||
        !Array.isArray(tests) ||
        tests.length === 0 ||
        tests.some((test) =>
          !test ||
          typeof test !== "object" ||
          !Object.hasOwn(test, "input") ||
          !Object.hasOwn(test, "expected"))
      ) {
        throw new Error(`Question "${id}" or its test-case JSON is invalid.`);
      }
      return {
        ...question,
        id,
        published: true,
        difficulty: ["Easy", "Medium", "Hard"].includes(question.difficulty) ? question.difficulty : "Easy",
        topic: typeof question.topic === "string" ? question.topic : "General",
        shortDescription: typeof question.shortDescription === "string" ? question.shortDescription : question.description,
        body: typeof question.body === "string" ? question.body : question.description,
        notes: Array.isArray(question.notes) ? question.notes.filter((note) => typeof note === "string") : [],
        tests,
        code: STARTER_CODE,
        starterCode: typeof question.starterCode === "string" ? question.starterCode : STARTER_CODE,
      };
    }));

    const savedById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
    const publishedIds = new Set(published.map((challenge) => challenge.id));
    challenges = [
      ...published.map((challenge) => ({
        ...challenge,
        code: savedById.get(challenge.id)?.code || challenge.starterCode,
        codes: savedById.get(challenge.id)?.codes || {},
      })),
      ...challenges.filter((challenge) => !publishedIds.has(challenge.id)),
    ];
    const requestedQuestion = new URLSearchParams(window.location.search).get("question");
    if (requestedQuestion && publishedIds.has(requestedQuestion)) activeChallengeId = requestedQuestion;
    if (!challenges.some((challenge) => challenge.id === activeChallengeId)) activeChallengeId = challenges[0].id;
    renderChallenge();
  } catch (error) {
    console.error("Could not load published questions:", error);
    showToast("Could not load the published question files. Check questions/index.json and the matching test-cases files.");
  }
}

function readSharedChallenge() {
  const encoded = new URLSearchParams(window.location.search).get("challenge");
  if (!encoded) return null;
  try {
    if (encoded.length > 100_000) throw new Error("This shared challenge is too large.");
    const shared = JSON.parse(encoded);
    if (
      typeof shared.title !== "string" ||
      typeof shared.description !== "string" ||
      !Array.isArray(shared.tests) ||
      shared.tests.length < 1 ||
      shared.tests.length > 25 ||
      shared.tests.some((test) =>
        !test ||
        typeof test !== "object" ||
        !Object.hasOwn(test, "input") ||
        !Object.hasOwn(test, "expected"))
    ) {
      throw new Error("The shared challenge is incomplete or invalid.");
    }
    const sharedId = typeof shared.id === "string" && /^[a-z0-9-]{1,80}$/i.test(shared.id)
      ? shared.id
      : `${Date.now()}`;
    return {
      id: sharedId.startsWith("shared-") ? sharedId : `shared-${sharedId}`,
      title: shared.title.slice(0, 70),
      difficulty: ["Easy", "Medium", "Hard"].includes(shared.difficulty) ? shared.difficulty : "Easy",
      topic: typeof shared.topic === "string" ? shared.topic.slice(0, 24) : "Shared",
      shortDescription: typeof shared.shortDescription === "string"
        ? shared.shortDescription.slice(0, 160)
        : shared.description.slice(0, 160),
      description: shared.description.slice(0, 4000),
      body: shared.description.slice(0, 4000),
      notes: ["Your solution should return a value for the given input."],
      tests: shared.tests,
      code: STARTER_CODE,
    };
  } catch (error) {
    console.warn("Could not load shared challenge:", error);
    setTimeout(() => showToast(error.message || "Could not load this shared challenge."), 0);
    return null;
  }
}

function saveChallenges() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
    document.querySelector(".saved-indicator").innerHTML = "<span></span> All changes saved";
    document.querySelector("#unsaved-dot").classList.remove("visible");
  } catch (error) {
    showToast("Could not save changes in this browser.");
    console.error("Could not save challenges:", error);
  }
}

function activeChallenge() {
  return challenges.find((challenge) => challenge.id === activeChallengeId);
}

function loadSubmissions() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUBMISSIONS_STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter((entry) =>
      entry &&
      typeof entry.id === "string" &&
      typeof entry.challengeId === "string" &&
      typeof entry.code === "string" &&
      Array.isArray(entry.outcomes)
    ) : [];
  } catch (error) {
    console.error("Could not load saved submissions:", error);
    return [];
  }
}

function saveSubmissions() {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    return true;
  } catch (error) {
    console.error("Could not save submission history:", error);
    showToast("Submission could not be saved. Check available browser storage.");
    return false;
  }
}

function latestSubmission(challengeId) {
  return submissions.find((submission) => submission.challengeId === challengeId) || null;
}

function solvedChallenge(challenge) {
  const currentTests = JSON.stringify(challenge.tests);
  return submissions.some((submission) =>
    submission.challengeId === challenge.id &&
    submission.allPassed &&
    submission.testsKey === currentTests
  );
}

function challengeProgress(challenge) {
  if (solvedChallenge(challenge)) return { label: "Solved", className: "solved" };
  if (latestSubmission(challenge.id)) return { label: "Attempted", className: "attempted" };
  const starterCode = starterChallenges.find((starter) => starter.id === challenge.id)?.code || STARTER_CODE;
  if (
    (challenge.code && challenge.code !== starterCode) ||
    Object.entries(challenge.codes || {}).some(([language, code]) => code && code !== COMPILED_STARTER_CODE[language])
  ) return { label: "In progress", className: "in-progress" };
  return { label: "Not started", className: "not-started" };
}

function renderProgressSummary() {
  const solved = challenges.filter(solvedChallenge).length;
  elements.progressCount.textContent = `${solved}/${challenges.length}`;
  elements.submissionCount.textContent = submissions.length;
}

function renderChallengeList() {
  elements.challengeList.replaceChildren();
  challenges.forEach((challenge) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `challenge-item${challenge.id === activeChallengeId ? " selected" : ""}`;
    button.innerHTML = '<span class="challenge-bullet"></span>';
    const title = document.createElement("span");
    title.textContent = challenge.title;
    button.append(title);
    button.addEventListener("click", () => selectChallenge(challenge.id));
    elements.challengeList.append(button);
  });
  elements.challengeCount.textContent = challenges.length;
  renderProgressSummary();
}

function renderChallenge() {
  const challenge = activeChallenge();
  if (!challenge) return;
  document.querySelector("#breadcrumb-title").textContent = challenge.title;
  elements.title.textContent = challenge.title;
  elements.description.textContent = challenge.shortDescription;
  elements.tags.replaceChildren();
  const difficulty = document.createElement("span");
  difficulty.className = `tag ${challenge.difficulty.toLowerCase()}`;
  difficulty.textContent = challenge.difficulty;
  const topic = document.createElement("span");
  topic.className = "tag";
  topic.textContent = challenge.topic;
  elements.tags.append(difficulty, topic);
  elements.body.textContent = challenge.body || challenge.description;
  elements.examples.replaceChildren();
  challenge.tests.slice(0, 2).forEach((test, index) => {
    const card = document.createElement("div");
    card.className = "example-card";
    const heading = document.createElement("div");
    heading.className = "example-title";
    heading.textContent = `Example ${index + 1}`;
    card.append(heading, exampleLine("Input", test.input), exampleLine("Output", test.expected));
    elements.examples.append(card);
  });
  elements.notes.replaceChildren();
  (challenge.notes?.length ? challenge.notes : ["Inputs and outputs use JSON values."]).forEach((note) => {
    const item = document.createElement("li");
    item.textContent = note;
    elements.notes.append(item);
  });
  const language = elements.language.value;
  elements.code.value = getChallengeCode(challenge, language);
  updateLanguageUi();
  renderSyntaxHighlight();
  updateLineNumbers();
  updateCursorPosition();
  updateTestCount();
  clearResults();
  renderChallengeList();
}

function getChallengeCode(challenge, language) {
  if (language === "javascript") return challenge.code || STARTER_CODE;
  challenge.codes ||= {};
  return challenge.codes[language] || COMPILED_STARTER_CODE[language];
}

function saveCurrentCode(challenge, language, code) {
  if (language === "javascript") {
    challenge.code = code;
    return;
  }
  challenge.codes ||= {};
  challenge.codes[language] = code;
}

function updateLanguageUi() {
  const language = LANGUAGE_OPTIONS[elements.language.value];
  elements.languageBadge.textContent = language.badge;
  elements.editorFilename.textContent = `solution.${language.extension}`;
  elements.editorLanguageStatus.innerHTML = `<span class="status-dot"></span> ${language.label}`;
  elements.code.setAttribute("aria-label", `${language.label} code editor`);
  elements.compilerNotice.hidden = elements.language.value === "javascript";
}

function exampleLine(label, value) {
  const row = document.createElement("div");
  row.className = "example-line";
  const key = document.createElement("span");
  key.className = "line-key";
  key.textContent = `${label}:`;
  const code = document.createElement("code");
  code.textContent = JSON.stringify(value);
  row.append(key, code);
  return row;
}

function selectChallenge(id) {
  const current = activeChallenge();
  if (current) saveCurrentCode(current, elements.language.value, elements.code.value);
  activeChallengeId = id;
  renderChallenge();
  saveChallenges();
}

function updateTestCount() {
  const count = activeChallenge().tests.length;
  elements.caseCount.textContent = `${count} ${count === 1 ? "case" : "cases"}`;
}

function updateLineNumbers() {
  const count = elements.code.value.split("\n").length;
  elements.lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
  elements.lineNumbers.scrollTop = elements.code.scrollTop;
}

function renderSyntaxHighlight() {
  const language = elements.language.value;
  const keywords = language === "javascript"
    ? /\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|switch|this|throw|try|typeof|var|void|while|yield)\b/
    : /\b(?:auto|break|case|catch|char|class|const|continue|default|delete|do|double|else|enum|explicit|extern|false|float|for|friend|if|inline|int|long|namespace|new|nullptr|private|protected|public|register|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|while|bool|constexpr|override|noexcept|std)\b/;
  const tokenPattern = /(^[ \t]*#.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|\b(?:0[xX][\da-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\b|[A-Za-z_$][\w$]*|(?:===?|!==?|=>|<=|>=|\+\+|--|&&|\|\||[+\-*\/%=<>!&|^~?:])|\s+/gm;
  const escapeHtml = (text) => text.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);
  const highlighted = elements.code.value.replace(tokenPattern, (token, directive, quoted, comment, offset) => {
    if (directive) return `<span class="syntax-preprocessor">${escapeHtml(token)}</span>`;
    if (quoted) return `<span class="syntax-string">${escapeHtml(token)}</span>`;
    if (comment) return `<span class="syntax-comment">${escapeHtml(token)}</span>`;
    if (/^(?:0[xX][\da-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)$/.test(token)) {
      return `<span class="syntax-number">${escapeHtml(token)}</span>`;
    }
    if (/^[A-Za-z_$]/.test(token)) {
      if (keywords.test(token)) return `<span class="syntax-keyword">${escapeHtml(token)}</span>`;
      if (/^(?:true|false|null|undefined|NaN|Infinity|NULL|EOF)$/.test(token)) {
        return `<span class="syntax-constant">${escapeHtml(token)}</span>`;
      }
      if (/^[A-Z][A-Z\d_]*$/.test(token)) return `<span class="syntax-constant">${escapeHtml(token)}</span>`;
      if (/^\s*\(/.test(elements.code.value.slice(offset + token.length))) {
        return `<span class="syntax-function">${escapeHtml(token)}</span>`;
      }
    }
    if (/^(?:===?|!==?|=>|<=|>=|\+\+|--|&&|\|\||[+\-*\/%=<>!&|^~?:])$/.test(token)) {
      return `<span class="syntax-operator">${escapeHtml(token)}</span>`;
    }
    return escapeHtml(token);
  });
  elements.syntaxHighlight.innerHTML = highlighted;
  syncEditorScroll();
}

function syncEditorScroll() {
  elements.lineNumbers.scrollTop = elements.code.scrollTop;
  elements.syntaxHighlight.parentElement.scrollTop = elements.code.scrollTop;
  elements.syntaxHighlight.parentElement.scrollLeft = elements.code.scrollLeft;
  elements.syntaxHighlight.style.transform = `translate(${-elements.code.scrollLeft}px, ${-elements.code.scrollTop}px)`;
}

function updateCursorPosition() {
  const beforeCursor = elements.code.value.slice(0, elements.code.selectionStart);
  const lines = beforeCursor.split("\n");
  elements.cursorLine.textContent = lines.length;
  elements.cursorColumn.textContent = lines.at(-1).length + 1;
}

function clearResults() {
  elements.results.innerHTML = '<div class="empty-results"><div class="empty-check">✓</div><div><strong>Ready when you are</strong><p>Run your code against the test cases to see how it does.</p></div></div>';
  elements.resultSummary.textContent = "No runs yet";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2800);
}

function parseJsonField(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function isEqual(actual, expected) {
  if (Object.is(actual, expected)) return true;
  if (typeof actual !== "object" || actual === null || typeof expected !== "object" || expected === null) return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  return actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index] && isEqual(actual[key], expected[key]));
}

function executeTest(code, input) {
  return new Promise((resolve) => {
    const source = `
      "use strict";
      const candidate = (${code}
      );
      if (typeof candidate !== "function") throw new Error("Your code must define a solution function.");
      const input = ${JSON.stringify(input)};
      Promise.resolve(candidate(input)).then(
        value => self.postMessage({ ok: true, value }),
        error => self.postMessage({ ok: false, error: error?.stack || String(error) })
      );
    `;
    let worker;
    let blobUrl;
    const timeoutId = setTimeout(() => {
      worker?.terminate();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      resolve({ error: "Execution timed out after 2 seconds." });
    }, 2000);
    try {
      blobUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
      worker = new Worker(blobUrl);
      worker.onmessage = (event) => {
        clearTimeout(timeoutId);
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
        resolve(event.data.ok ? { value: event.data.value } : { error: event.data.error });
      };
      worker.onerror = (event) => {
        clearTimeout(timeoutId);
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
        resolve({ error: event.message || "Could not run this code." });
      };
      worker.postMessage(null);
    } catch (error) {
      clearTimeout(timeoutId);
      if (worker) worker.terminate();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      resolve({ error: error.message || "Could not start the code runner." });
    }
  });
}

async function runTests() {
  const code = elements.code.value.trim();
  const language = elements.language.value;
  if (!code) {
    showToast("Write a solution before running the tests.");
    return null;
  }
  elements.runButton.disabled = true;
  elements.runButton.innerHTML = '<span class="play-icon">◌</span> Running…';
  const startedAt = performance.now();
  try {
    const outcomes = [];
    for (const [index, test] of activeChallenge().tests.entries()) {
      const result = language === "javascript"
        ? await executeTest(code, test.input)
        : await executeCompiledTest(code, language, test.input);
      outcomes.push({
        index: index + 1,
        input: test.input,
        expected: test.expected,
        actual: result.value,
        error: result.error,
        passed: !result.error && isEqual(result.value, test.expected),
      });
    }
    const duration = Math.max(1, Math.round(performance.now() - startedAt));
    renderResults(outcomes, duration);
    return { outcomes, duration, language };
  } catch (error) {
    console.error("Could not finish running test cases:", error);
    showToast(error.message || "Could not finish running the tests. Please try again.");
    return null;
  } finally {
    elements.runButton.disabled = false;
    elements.runButton.innerHTML = '<span class="play-icon">▶</span> Run tests <kbd>⌘ ↵</kbd>';
  }
}

function serializeCompilerInput(input) {
  if (Array.isArray(input) && input.every((value) => ["string", "number", "boolean"].includes(typeof value))) {
    return input.map(String).join(" ");
  }
  if (typeof input === "string") return input;
  if (input === null || ["number", "boolean"].includes(typeof input)) return String(input);
  return JSON.stringify(input);
}

function parseCompilerOutput(output) {
  const trimmed = output.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

async function executeCompiledTest(code, language, input) {
  const compiler = language === "c" ? "gcc-13.2.0-c" : "gcc-13.2.0";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(WANDBOX_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler,
        code,
        stdin: serializeCompilerInput(input),
        save: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Wandbox returned HTTP ${response.status}.`);
    }
    const result = await response.json();
    if (result.compiler_error || (result.status !== "0" && result.compiler_message)) {
      return { error: result.compiler_error || result.compiler_message };
    }
    if (result.program_error || result.signal) {
      return {
        error: [result.program_error, result.signal && `Program terminated with signal ${result.signal}.`]
          .filter(Boolean)
          .join("\n"),
      };
    }
    if (result.status !== "0") {
      return { error: `Program exited with status ${result.status || "unknown"}.` };
    }
    if (typeof result.program_output !== "string") {
      throw new Error("Wandbox returned an invalid compiler result.");
    }
    return { value: parseCompilerOutput(result.program_output) };
  } catch (error) {
    if (error.name === "AbortError") {
      return { error: "Compilation or execution timed out after 20 seconds." };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function submitSolution() {
  if (elements.submitButton.disabled) return;
  const code = elements.code.value.trim();
  if (!code) {
    showToast("Write a solution before submitting.");
    return;
  }
  elements.submitButton.disabled = true;
  elements.submitButton.innerHTML = '<span>◌</span> Submitting…';
  try {
    const run = await runTests();
    if (!run) return;
    const challenge = activeChallenge();
    const passedCount = run.outcomes.filter((outcome) => outcome.passed).length;
    const submission = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      code,
      language: run.language,
      submittedAt: new Date().toISOString(),
      duration: run.duration,
      passedCount,
      totalCount: run.outcomes.length,
      allPassed: passedCount === run.outcomes.length,
      testsKey: JSON.stringify(challenge.tests),
      outcomes: run.outcomes.map((outcome) => ({
        index: outcome.index,
        input: formatValue(outcome.input),
        expected: formatValue(outcome.expected),
        actual: formatValue(outcome.actual),
        error: outcome.error ? String(outcome.error).slice(0, 500) : "",
        passed: outcome.passed,
      })),
    };
    const previousSubmissions = submissions;
    submissions = [submission, ...submissions].slice(0, 100);
    if (!saveSubmissions()) {
      submissions = previousSubmissions;
      return;
    }
    renderProgressSummary();
    if (elements.progressModal.open) renderProgress();
    if (elements.submissionsModal.open) renderSubmissions();
    showToast(submission.allPassed
      ? "All tests passed. Challenge solved and submission saved."
      : `Submission saved: ${passedCount}/${run.outcomes.length} tests passed.`);
  } catch (error) {
    console.error("Could not submit this solution:", error);
    showToast("Could not submit this solution. Please try again.");
  } finally {
    elements.submitButton.disabled = false;
    elements.submitButton.innerHTML = '<span>✓</span> Submit solution';
  }
}

function renderResults(outcomes, duration) {
  elements.results.replaceChildren();
  const passed = outcomes.filter((outcome) => outcome.passed).length;
  elements.resultSummary.textContent = `${passed}/${outcomes.length} passed · ${duration} ms`;
  outcomes.forEach((outcome) => {
    const card = document.createElement("article");
    card.className = "result-case";
    const head = document.createElement("div");
    head.className = "result-case-head";
    const name = document.createElement("strong");
    name.textContent = `Test case ${outcome.index}`;
    const status = document.createElement("span");
    status.className = outcome.passed ? "pass-label" : "fail-label";
    status.textContent = outcome.passed ? "✓ Passed" : "× Failed";
    head.append(name, status);
    card.append(head);
    const body = document.createElement("div");
    body.className = "result-case-body";
    body.append(resultValue("Input", outcome.input), resultValue("Expected", outcome.expected));
    if (!outcome.error) body.append(resultValue("Your output", outcome.actual));
    card.append(body);
    if (outcome.error) {
      const error = document.createElement("div");
      error.className = "case-error";
      error.textContent = outcome.error.split("\n")[0];
      card.append(error);
    }
    elements.results.append(card);
  });
}

function resultValue(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "result-value";
  const title = document.createElement("span");
  title.textContent = label;
  const content = document.createElement("code");
  content.textContent = formatValue(value);
  wrapper.append(title, content);
  return wrapper;
}

function formatValue(value) {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function renderProgress() {
  const solved = challenges.filter(solvedChallenge).length;
  const percentage = challenges.length ? Math.round((solved / challenges.length) * 100) : 0;
  elements.progressPercentage.textContent = `${percentage}%`;
  elements.progressHeadline.textContent = `${solved} of ${challenges.length} challenges solved`;
  elements.progressBar.style.width = `${percentage}%`;
  elements.progressRing.style.setProperty("--progress-value", `${percentage}%`);
  elements.progressList.replaceChildren();

  challenges.forEach((challenge) => {
    const progress = challengeProgress(challenge);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "tracker-row";
    const copy = document.createElement("span");
    copy.className = "tracker-row-copy";
    const title = document.createElement("strong");
    title.textContent = challenge.title;
    const topic = document.createElement("small");
    topic.textContent = `${challenge.topic} · ${challenge.difficulty}`;
    copy.append(title, topic);
    const status = document.createElement("span");
    status.className = `tracker-status ${progress.className}`;
    status.textContent = progress.label;
    row.append(copy, status);
    row.addEventListener("click", () => {
      elements.progressModal.close();
      selectChallenge(challenge.id);
    });
    elements.progressList.append(row);
  });
}

function renderSubmissions() {
  elements.submissionList.replaceChildren();
  if (!submissions.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    const title = document.createElement("strong");
    title.textContent = "No submissions yet";
    const message = document.createElement("p");
    message.textContent = "Open a challenge, write your solution, and choose Submit solution to save your code here.";
    empty.append(title, message);
    elements.submissionList.append(empty);
    return;
  }

  submissions.forEach((submission) => {
    const item = document.createElement("article");
    item.className = "submission-entry";
    const header = document.createElement("div");
    header.className = "submission-entry-header";
    const title = document.createElement("strong");
    title.textContent = submission.challengeTitle ||
      challenges.find((challenge) => challenge.id === submission.challengeId)?.title ||
      "Challenge";
    const status = document.createElement("span");
    status.className = `tracker-status ${submission.allPassed ? "solved" : "attempted"}`;
    status.textContent = submission.allPassed ? "All tests passed" : `${submission.passedCount}/${submission.totalCount} passed`;
    const headerActions = document.createElement("div");
    headerActions.className = "submission-header-actions";
    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "download-submission";
    downloadButton.textContent = "↓ Download for GitHub";
    downloadButton.addEventListener("click", () => downloadSubmission(submission));
    headerActions.append(status, downloadButton);
    header.append(title, headerActions);
    const metadata = document.createElement("p");
    const submittedAt = new Date(submission.submittedAt);
    const language = LANGUAGE_OPTIONS[submission.language]?.label || "JavaScript";
    metadata.textContent = `${language} · ${Number.isNaN(submittedAt.getTime()) ? "Date unavailable" : submittedAt.toLocaleString()} · ${submission.duration} ms`;
    const details = document.createElement("details");
    details.className = "submission-details";
    const summary = document.createElement("summary");
    summary.textContent = "View submitted code and run details";
    const code = document.createElement("pre");
    code.className = "submission-code";
    code.textContent = submission.code;
    const outcomes = document.createElement("div");
    outcomes.className = "submission-outcomes";
    submission.outcomes.forEach((outcome) => {
      const caseResult = document.createElement("div");
      caseResult.className = "submission-case";
      const caseTitle = document.createElement("strong");
      caseTitle.textContent = `Test ${outcome.index}: ${outcome.passed ? "Passed" : "Failed"}`;
      caseTitle.className = outcome.passed ? "pass-label" : "fail-label";
      const values = document.createElement("p");
      values.textContent = `Input ${outcome.input} · Expected ${outcome.expected}${outcome.error ? ` · Error: ${outcome.error}` : ` · Output ${outcome.actual}`}`;
      caseResult.append(caseTitle, values);
      outcomes.append(caseResult);
    });
    details.append(summary, code, outcomes);
    item.append(header, metadata, details);
    elements.submissionList.append(item);
  });
}

function downloadSubmission(submission) {
  try {
    const datePart = new Date(submission.submittedAt).toISOString().replace(/[:.]/g, "-");
    const safeChallengeId = submission.challengeId.replace(/[^a-z0-9-]/gi, "-");
    const fileName = `${safeChallengeId}-${datePart}.json`;
    const blobUrl = URL.createObjectURL(new Blob([`${JSON.stringify(submission, null, 2)}\n`], {
      type: "application/json",
    }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    showToast("Submission downloaded. Move it into the submissions folder and push it with VS Code.");
  } catch (error) {
    console.error("Could not download submission:", error);
    showToast("Could not download this submission.");
  }
}

function addTestInput(container, input = "", expected = "") {
  const row = document.createElement("div");
  row.className = "test-case-input";
  const inputLabel = document.createElement("label");
  inputLabel.textContent = "INPUT";
  const inputArea = document.createElement("textarea");
  inputArea.required = true;
  inputArea.value = input;
  inputArea.placeholder = "[2, 7]";
  inputLabel.append(inputArea);
  const expectedLabel = document.createElement("label");
  expectedLabel.textContent = "EXPECTED OUTPUT";
  const expectedArea = document.createElement("textarea");
  expectedArea.required = true;
  expectedArea.value = expected;
  expectedArea.placeholder = "9";
  expectedLabel.append(expectedArea);
  row.append(inputLabel, expectedLabel);
  container.append(row);
}

document.querySelectorAll(".add-question-button").forEach((button) => button.addEventListener("click", () => {
  elements.questionForm.reset();
  elements.questionTests.replaceChildren();
  addTestInput(elements.questionTests, "", "");
  elements.questionModal.showModal();
}));

document.querySelectorAll(".modal-close, .cancel-button").forEach((button) => button.addEventListener("click", () => {
  button.closest("dialog").close();
}));

document.querySelector("#add-question-test").addEventListener("click", () => addTestInput(elements.questionTests));
document.querySelector("#add-case-button").addEventListener("click", () => {
  elements.caseForm.reset();
  elements.caseModal.showModal();
});

elements.questionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.questionForm);
  try {
    const tests = [...elements.questionTests.querySelectorAll(".test-case-input")].map((row) => ({
      input: parseJsonField(row.querySelector("label:first-child textarea").value, "Input"),
      expected: parseJsonField(row.querySelector("label:last-child textarea").value, "Expected output"),
    }));
    if (!tests.length) throw new Error("Add at least one test case.");
    const title = formData.get("title").trim();
    const challenge = {
      id: `custom-${Date.now()}`,
      title,
      difficulty: formData.get("difficulty"),
      topic: formData.get("topic").trim() || "Custom",
      shortDescription: formData.get("description").trim().split("\n")[0],
      description: formData.get("description").trim(),
      body: formData.get("description").trim(),
      notes: ["Your solution should return a value for the given input."],
      tests,
      code: STARTER_CODE,
    };
    const current = activeChallenge();
    if (current) current.code = elements.code.value;
    challenges.push(challenge);
    activeChallengeId = challenge.id;
    saveChallenges();
    renderChallenge();
    loadPublishedQuestions();
    if (new URLSearchParams(window.location.search).get("view") === "submissions") {
      renderSubmissions();
      elements.submissionsModal.showModal();
    }
    elements.questionModal.close();
    showToast("Challenge created. Your question is ready to solve.");
  } catch (error) {
    showToast(error.message);
  }
});

elements.caseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.caseForm);
  try {
    activeChallenge().tests.push({
      input: parseJsonField(formData.get("input"), "Input"),
      expected: parseJsonField(formData.get("expected"), "Expected output"),
    });
    saveChallenges();
    renderChallenge();
    elements.caseModal.close();
    showToast("Test case added.");
  } catch (error) {
    showToast(error.message);
  }
});

elements.code.addEventListener("input", () => {
  renderSyntaxHighlight();
  updateLineNumbers();
  updateCursorPosition();
  document.querySelector("#unsaved-dot").classList.add("visible");
  const challenge = activeChallenge();
  if (challenge) saveCurrentCode(challenge, elements.language.value, elements.code.value);
  saveChallenges();
});
elements.language.addEventListener("change", () => {
  const challenge = activeChallenge();
  if (challenge) saveCurrentCode(challenge, activeLanguage, elements.code.value);
  activeLanguage = elements.language.value;
  if (challenge) elements.code.value = getChallengeCode(challenge, activeLanguage);
  updateLanguageUi();
  renderSyntaxHighlight();
  updateLineNumbers();
  updateCursorPosition();
  clearResults();
  saveChallenges();
});
elements.code.addEventListener("scroll", syncEditorScroll);
elements.code.addEventListener("click", updateCursorPosition);
elements.code.addEventListener("keyup", updateCursorPosition);
elements.code.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = elements.code.selectionStart;
    const end = elements.code.selectionEnd;
    elements.code.setRangeText("  ", start, end, "end");
    elements.code.dispatchEvent(new Event("input"));
  }
});
elements.runButton.addEventListener("click", runTests);
elements.submitButton.addEventListener("click", submitSolution);
elements.progressButton.addEventListener("click", () => {
  renderProgress();
  elements.progressModal.showModal();
});
elements.submissionsButton.addEventListener("click", () => {
  renderSubmissions();
  elements.submissionsModal.showModal();
});
document.querySelector("#reset-button").addEventListener("click", () => {
  const challenge = activeChallenge();
  const language = elements.language.value;
  const starter = language === "javascript"
    ? starterChallenges.find((item) => item.id === challenge.id)?.code || STARTER_CODE
    : COMPILED_STARTER_CODE[language];
  elements.code.value = starter;
  elements.code.dispatchEvent(new Event("input"));
  showToast("Starter code restored.");
});
document.querySelector("#all-challenges-button").addEventListener("click", () => {
  renderChallengeList();
  showToast(`${challenges.length} challenges in your workspace.`);
});
document.querySelector("#invite-button").addEventListener("click", async () => {
  const challenge = activeChallenge();
  const shareUrl = new URL(window.location.href);
  shareUrl.searchParams.set("challenge", JSON.stringify({
    id: challenge.id,
    title: challenge.title,
    difficulty: challenge.difficulty,
    topic: challenge.topic,
    shortDescription: challenge.shortDescription,
    description: challenge.description,
    tests: challenge.tests,
  }));
  try {
    await navigator.clipboard.writeText(shareUrl.href);
    showToast(window.location.protocol === "file:"
      ? "Challenge link copied. Host this page online before sharing it."
      : "Challenge link copied. Share it with your collaborator.");
  } catch {
    window.prompt("Copy this challenge link:", shareUrl.href);
  }
});
document.querySelector("#help-button").addEventListener("click", () => {
  showToast(elements.language.value === "javascript"
    ? "Write a JavaScript function named solution(input), then run the test cases."
    : "Read each test case from standard input and print your answer to standard output.");
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    runTests();
  }
});

renderChallenge();
