const LOGIN_SESSION_KEY = "paircode-demo-login";
const CHALLENGES_STORAGE_KEY = "paircode-challenges-v1";
const SUBMISSIONS_STORAGE_KEY = "paircode-submissions-v1";

if (localStorage.getItem(LOGIN_SESSION_KEY) !== "1" && sessionStorage.getItem(LOGIN_SESSION_KEY) !== "1") {
  window.location.replace(new URL("index.html", window.location.href));
}

const challengeContainer = document.querySelector("#dashboard-challenges");
const recentContainer = document.querySelector("#dashboard-recent");

function readLocalArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return [];
  }
}

function safeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function challengeStatus(challenge, submissions) {
  const challengeSubmissions = submissions.filter((entry) => entry.challengeId === challenge.id);
  if (challengeSubmissions.some((entry) => entry.allPassed && entry.testsKey === JSON.stringify(challenge.tests))) {
    return { label: "Solved", className: "solved" };
  }
  if (challengeSubmissions.length) return { label: "Attempted", className: "attempted" };
  const savedCode = challenge.savedCode;
  const starterCode = challenge.starterCode || "";
  if (savedCode && savedCode !== starterCode) return { label: "In progress", className: "in-progress" };
  return { label: "Not started", className: "not-started" };
}

async function loadDashboard() {
  const localChallenges = readLocalArray(CHALLENGES_STORAGE_KEY);
  const submissions = readLocalArray(SUBMISSIONS_STORAGE_KEY);
  let challenges = [];

  try {
    const indexResponse = await fetch(new URL("questions/index.json", window.location.href));
    if (!indexResponse.ok) throw new Error(`Question index request failed (${indexResponse.status}).`);
    const ids = await indexResponse.json();
    if (!Array.isArray(ids)) throw new Error("Question index should contain an array.");
    challenges = await Promise.all(ids.map(async (id) => {
      if (typeof id !== "string" || !/^[a-z0-9-]{1,80}$/i.test(id)) {
        throw new Error("Question index contains an invalid question ID.");
      }
      const [questionResponse, testsResponse] = await Promise.all([
        fetch(new URL(`questions/${id}.json`, window.location.href)),
        fetch(new URL(`test-cases/${id}.json`, window.location.href)),
      ]);
      if (!questionResponse.ok || !testsResponse.ok) throw new Error(`Question "${id}" or its tests could not be loaded.`);
      const [question, tests] = await Promise.all([questionResponse.json(), testsResponse.json()]);
      return { ...question, id, tests, published: true };
    }));
  } catch (error) {
    console.error("Could not load dashboard challenges:", error);
    challengeContainer.replaceChildren(safeElement("p", "dashboard-error", "Could not load the published challenges. Open the challenge workspace to try again."));
  }

  const knownIds = new Set(challenges.map((challenge) => challenge.id));
  localChallenges.forEach((challenge) => {
    if (!knownIds.has(challenge.id)) {
      challenges.push({
        ...challenge,
        tests: Array.isArray(challenge.tests) ? challenge.tests : [],
        starterCode: challenge.id.startsWith("custom-") ? "" : challenge.code,
        savedCode: challenge.code,
      });
    } else {
      const published = challenges.find((entry) => entry.id === challenge.id);
      published.savedCode = challenge.code;
    }
  });

  const solvedCount = challenges.filter((challenge) =>
    challengeStatus(challenge, submissions).label === "Solved"
  ).length;
  document.querySelector("#dash-solved").textContent = solvedCount;
  document.querySelector("#dash-total").textContent = challenges.length;
  document.querySelector("#dash-submissions").textContent = submissions.length;
  document.querySelector("#dash-solved-caption").textContent = challenges.length
    ? `${Math.round((solvedCount / challenges.length) * 100)}% of your challenges complete`
    : "Add a challenge to get started";

  challengeContainer.replaceChildren();
  challenges.forEach((challenge) => {
    const status = challengeStatus(challenge, submissions);
    const card = document.createElement("article");
    card.className = "dashboard-challenge-card";
    const top = safeElement("div", "dashboard-challenge-card-top");
    const topic = safeElement("span", "dashboard-topic", challenge.topic || "General");
    const badge = safeElement("span", `dashboard-status ${status.className}`, status.label);
    top.append(topic, badge);
    const title = safeElement("h3", "", challenge.title || "Untitled challenge");
    const description = safeElement("p", "", challenge.shortDescription || challenge.description || "");
    const difficulty = safeElement("span", "dashboard-difficulty", challenge.difficulty || "Easy");
    const openLink = document.createElement("a");
    openLink.className = "dashboard-card-link";
    openLink.textContent = "Open challenge →";
    const editorUrl = new URL("index.html", window.location.href);
    if (challenge.published) {
      editorUrl.searchParams.set("question", challenge.id);
    } else {
      editorUrl.searchParams.set("challenge", JSON.stringify({
        id: challenge.id,
        title: challenge.title,
        difficulty: challenge.difficulty,
        topic: challenge.topic,
        shortDescription: challenge.shortDescription,
        description: challenge.description,
        tests: challenge.tests,
      }));
    }
    openLink.href = editorUrl.href;
    card.append(top, title, description, difficulty, openLink);
    challengeContainer.append(card);
  });
  renderRecentSubmissions(submissions, challenges);
}

function renderRecentSubmissions(submissions, challenges) {
  recentContainer.replaceChildren();
  if (!submissions.length) {
    const empty = safeElement("div", "dashboard-recent-empty");
    empty.append(
      safeElement("strong", "", "No submissions yet"),
      safeElement("p", "", "Your submitted solutions and test results will show up here."),
    );
    recentContainer.append(empty);
    return;
  }
  submissions.slice(0, 3).forEach((submission) => {
    const item = safeElement("a", "dashboard-recent-item");
    const savedChallenge = challenges.find((challenge) => challenge.id === submission.challengeId);
    const copy = safeElement("span", "dashboard-recent-copy");
    copy.append(
      safeElement("strong", "", submission.challengeTitle || savedChallenge?.title || "Challenge"),
      safeElement("small", "", new Date(submission.submittedAt).toLocaleString()),
    );
    const result = safeElement(
      "span",
      `dashboard-recent-result ${submission.allPassed ? "solved" : "attempted"}`,
      submission.allPassed ? "All tests passed" : `${submission.passedCount}/${submission.totalCount} passed`,
    );
    item.href = new URL("index.html?view=submissions", window.location.href).href;
    item.append(copy, result);
    recentContainer.append(item);
  });
}

document.querySelector("#signout-button").addEventListener("click", () => {
  localStorage.removeItem(LOGIN_SESSION_KEY);
  sessionStorage.removeItem(LOGIN_SESSION_KEY);
  window.location.replace(new URL("index.html", window.location.href));
});

loadDashboard();
