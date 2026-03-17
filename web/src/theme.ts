export type ColorScheme = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";

function systemScheme(): ColorScheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem("theme");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.colorSchemeFollowsSystem === true) return "system";
      if (parsed.colorScheme === "light" || parsed.colorScheme === "dark") {
        return parsed.colorScheme;
      }
    }
  } catch {
    // ignore
  }
  return "system";
}

export function getColorScheme(): ColorScheme {
  const pref = getThemePreference();
  if (pref === "light" || pref === "dark") return pref;
  return systemScheme();
}

export function setThemePreference(pref: ThemePreference) {
  try {
    const raw = localStorage.getItem("theme");
    const obj = raw ? JSON.parse(raw) : {};
    const followsSystem = pref === "system";
    obj.colorSchemeFollowsSystem = followsSystem;
    obj.colorScheme = followsSystem ? systemScheme() : pref;
    localStorage.setItem("theme", JSON.stringify(obj));
  } catch {
    // ignore
  }
  applyTheme(getColorScheme());
}

export function applyTheme(scheme: ColorScheme) {
  document.documentElement.setAttribute("data-theme", scheme);
}
