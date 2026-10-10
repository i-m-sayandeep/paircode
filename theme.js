(() => {
  const storageKey = "paircode-theme";
  const root = document.body;

  function applyTheme(theme) {
    const selectedTheme = theme === "light" ? "light" : "dark";
    root.dataset.theme = selectedTheme;
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const nextTheme = selectedTheme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
      button.querySelector(".theme-toggle-label").textContent = `${nextTheme[0].toUpperCase()}${nextTheme.slice(1)} theme`;
      button.querySelector(".theme-toggle-icon").textContent = nextTheme === "light" ? "☼" : "☾";
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      selectedTheme === "dark" ? "#101116" : "#f6f7fb",
    );
  }

  let initialTheme = "dark";
  try {
    initialTheme = localStorage.getItem(storageKey) || "dark";
  } catch (error) {
    console.warn("Could not read saved theme:", error);
  }
  applyTheme(initialTheme);

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch (error) {
        console.warn("Could not save theme preference:", error);
      }
    });
  });
})();
