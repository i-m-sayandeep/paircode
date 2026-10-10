const LOGIN_SESSION_KEY = "paircode-demo-login";
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");

try {
  if (localStorage.getItem(LOGIN_SESSION_KEY) === "1" || sessionStorage.getItem(LOGIN_SESSION_KEY) === "1") {
    window.location.replace(new URL("dashboard.html", window.location.href));
  }
} catch (error) {
  console.error("Could not read the demo login session:", error);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const formData = new FormData(loginForm);
  if (formData.get("username") !== "suchetana" || formData.get("password") !== "suchetana") {
    loginError.textContent = "That demo username or password is incorrect.";
    loginError.hidden = false;
    return;
  }
  try {
    localStorage.setItem(LOGIN_SESSION_KEY, "1");
    sessionStorage.setItem(LOGIN_SESSION_KEY, "1");
    loginError.hidden = true;
    window.location.assign(new URL("dashboard.html", window.location.href));
  } catch (error) {
    loginError.textContent = "Could not save this demo session in your browser. Please check your browser storage settings.";
    loginError.hidden = false;
    console.error("Could not save the demo login session:", error);
  }
});
