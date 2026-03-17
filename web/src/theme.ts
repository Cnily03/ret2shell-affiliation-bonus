export type ColorScheme = "light" | "dark";

export function getColorScheme(): ColorScheme {
  try {
    const raw = localStorage.getItem("theme");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.colorScheme === "light" || parsed.colorScheme === "dark") {
        return parsed.colorScheme;
      }
    }
  } catch {
    // ignore
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setColorScheme(scheme: ColorScheme) {
  try {
    const raw = localStorage.getItem("theme");
    const obj = raw ? JSON.parse(raw) : {};
    obj.colorScheme = scheme;
    localStorage.setItem("theme", JSON.stringify(obj));
  } catch {
    // ignore
  }
  applyTheme(scheme);
}

export function applyTheme(scheme: ColorScheme) {
  document.documentElement.setAttribute("data-theme", scheme);
}
