const DEFAULT_SETTINGS = {
  enabled: true,
  theme: "dark",
  fontScale: 100,
  fontFamily: "accessible"
};

const THEME_MAP = {
  dark: {
    bg: "#101418",
    surface: "#182028",
    text: "#f8fafc",
    muted: "#dbe4ee",
    accent: "#ffd54f",
    border: "#8fb3d9"
  },
  light: {
    bg: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#334155",
    accent: "#005fcc",
    border: "#7aa2d6"
  },
  sepia: {
    bg: "#f4ecd8",
    surface: "#eadfc4",
    text: "#2f2419",
    muted: "#4d3c2f",
    accent: "#8a4b08",
    border: "#c28b52"
  },
  blue: {
    bg: "#071a2d",
    surface: "#0d2742",
    text: "#fff3bf",
    muted: "#d8e7ff",
    accent: "#8bd3ff",
    border: "#79b8e8"
  }
};

const FONT_MAP = {
  accessible: 'Arial, Verdana, Tahoma, sans-serif',
  arial: 'Arial, sans-serif',
  verdana: 'Verdana, sans-serif',
  tahoma: 'Tahoma, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};

const STYLE_ID = "ext-contrast-style";
const ROOT_CLASS = "ext-contrast-enabled";
const MARK_ATTR = "data-ext-contrast-mark";
const ORIGINAL_FONT_ATTR = "data-ext-contrast-original-font-size";
const ORIGINAL_BG_ATTR = "data-ext-contrast-original-bg";
const ORIGINAL_COLOR_ATTR = "data-ext-contrast-original-color";
const ORIGINAL_BORDER_ATTR = "data-ext-contrast-original-border";
const ORIGINAL_FONT_FAMILY_ATTR = "data-ext-contrast-original-font-family";

let observer = null;
let scheduledApply = false;
let latestSettings = { ...DEFAULT_SETTINGS };

function ensureStyleTag() {
  let styleTag = document.getElementById(STYLE_ID);

  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = STYLE_ID;
    document.documentElement.appendChild(styleTag);
  }

  return styleTag;
}

function isTransparent(colorValue) {
  if (!colorValue || colorValue === "transparent") {
    return true;
  }

  const match = colorValue.match(/rgba?\(([^)]+)\)/i);

  if (!match) {
    return false;
  }

  const parts = match[1].split(",").map((value) => value.trim());

  if (parts.length < 4) {
    return false;
  }

  return Number(parts[3]) === 0;
}

function isMediaElement(element) {
  return element.matches("img, svg, video, canvas, picture, iframe, object, embed");
}

function shouldSkipElement(element) {
  return (
    isMediaElement(element) ||
    element.matches("script, style, link, meta, noscript, br, hr") ||
    element.closest(`#${STYLE_ID}`) !== null
  );
}

function isTextualElement(element) {
  return element.matches(
    [
      "body",
      "main",
      "article",
      "section",
      "aside",
      "nav",
      "header",
      "footer",
      "div",
      "span",
      "p",
      "a",
      "li",
      "dt",
      "dd",
      "td",
      "th",
      "label",
      "button",
      "input",
      "textarea",
      "select",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "mat-card",
      "mat-toolbar",
      "mat-sidenav",
      "mat-sidenav-content",
      "mat-list-item",
      "nz-layout",
      "nz-header",
      "nz-content",
      "nz-sider",
      "nz-card",
      "nz-table"
    ].join(",")
  );
}

function shouldUseRootBackground(element) {
  return element.matches(
    [
      "html",
      "body",
      "app-root",
      "mat-sidenav-container",
      "mat-drawer-container",
      "mat-sidenav-content",
      ".mat-drawer-content",
      ".mat-app-background",
      ".cdk-overlay-container",
      "nz-layout",
      "nz-content",
      "[class*='layout']",
      "[class*='page']",
      "[class*='content']"
    ].join(",")
  );
}

function ensureOriginalValue(element, attributeName, propertyName) {
  if (!element.hasAttribute(attributeName)) {
    element.setAttribute(attributeName, element.style[propertyName] || "");
  }
}

function applyInlineOverrides(element, settings) {
  if (shouldSkipElement(element)) {
    return;
  }

  const theme = THEME_MAP[settings.theme] || THEME_MAP.dark;
  const computedStyle = window.getComputedStyle(element);

  if (computedStyle.display === "none" || computedStyle.visibility === "hidden") {
    return;
  }

  if (shouldUseRootBackground(element)) {
    ensureOriginalValue(element, ORIGINAL_BG_ATTR, "backgroundColor");
    element.style.setProperty("background-color", theme.bg, "important");
  } else if (
    !isMediaElement(element) &&
    !isTransparent(computedStyle.backgroundColor) &&
    computedStyle.backgroundImage === "none"
  ) {
    ensureOriginalValue(element, ORIGINAL_BG_ATTR, "backgroundColor");
    element.style.setProperty("background-color", theme.surface, "important");
  }

  if (shouldUseRootBackground(element) || isTextualElement(element)) {
    ensureOriginalValue(element, ORIGINAL_COLOR_ATTR, "color");
    element.style.setProperty(
      "color",
      element.tagName.toLowerCase() === "a" ? theme.accent : theme.text,
      "important"
    );
  }

  if (computedStyle.borderStyle !== "none" && computedStyle.borderWidth !== "0px") {
    ensureOriginalValue(element, ORIGINAL_BORDER_ATTR, "borderColor");
    element.style.setProperty("border-color", theme.border, "important");
  }

  if (isTextualElement(element) && !element.matches("mat-icon, .material-icons, [class*='icon']")) {
    const currentFontSize = Number.parseFloat(computedStyle.fontSize);

    if (Number.isFinite(currentFontSize) && currentFontSize > 0) {
      if (!element.hasAttribute(ORIGINAL_FONT_ATTR)) {
        element.setAttribute(ORIGINAL_FONT_ATTR, String(currentFontSize));
      }

      const originalSize = Number.parseFloat(element.getAttribute(ORIGINAL_FONT_ATTR));
      const scaledSize = Math.max(originalSize * (settings.fontScale / 100), originalSize);
      element.style.setProperty("font-size", `${scaledSize}px`, "important");
    }

    ensureOriginalValue(element, ORIGINAL_FONT_FAMILY_ATTR, "fontFamily");
    element.style.setProperty("font-family", FONT_MAP[settings.fontFamily] || FONT_MAP.accessible, "important");
  }

  element.setAttribute(MARK_ATTR, "1");
}

function restoreMarkedElements() {
  document.querySelectorAll(`[${MARK_ATTR}="1"]`).forEach((element) => {
    element.style.backgroundColor = element.getAttribute(ORIGINAL_BG_ATTR) || "";
    element.style.color = element.getAttribute(ORIGINAL_COLOR_ATTR) || "";
    element.style.borderColor = element.getAttribute(ORIGINAL_BORDER_ATTR) || "";
    element.style.fontSize = element.getAttribute(ORIGINAL_FONT_ATTR)
      ? `${element.getAttribute(ORIGINAL_FONT_ATTR)}px`
      : "";
    element.style.fontFamily = element.getAttribute(ORIGINAL_FONT_FAMILY_ATTR) || "";

    element.removeAttribute(MARK_ATTR);
    element.removeAttribute(ORIGINAL_BG_ATTR);
    element.removeAttribute(ORIGINAL_COLOR_ATTR);
    element.removeAttribute(ORIGINAL_BORDER_ATTR);
    element.removeAttribute(ORIGINAL_FONT_ATTR);
    element.removeAttribute(ORIGINAL_FONT_FAMILY_ATTR);
  });
}

function buildCss(settings) {
  const theme = THEME_MAP[settings.theme] || THEME_MAP.dark;
  const fontFamily = FONT_MAP[settings.fontFamily] || FONT_MAP.accessible;

  return `
    html.${ROOT_CLASS} {
      --ext-contrast-bg: ${theme.bg};
      --ext-contrast-surface: ${theme.surface};
      --ext-contrast-text: ${theme.text};
      --ext-contrast-muted: ${theme.muted};
      --ext-contrast-accent: ${theme.accent};
      --ext-contrast-border: ${theme.border};
      --ext-contrast-font-family: ${fontFamily};
      color-scheme: ${settings.theme === "light" ? "light" : "dark"};
      background-color: var(--ext-contrast-bg) !important;
      color: var(--ext-contrast-text) !important;
    }

    html.${ROOT_CLASS},
    html.${ROOT_CLASS} body,
    html.${ROOT_CLASS} app-root {
      background-color: var(--ext-contrast-bg) !important;
      color: var(--ext-contrast-text) !important;
      font-family: var(--ext-contrast-font-family) !important;
    }

    html.${ROOT_CLASS} {
      font-size: ${settings.fontScale}% !important;
    }

    html.${ROOT_CLASS} * {
      scrollbar-color: var(--ext-contrast-accent) var(--ext-contrast-surface);
      caret-color: var(--ext-contrast-accent) !important;
    }

    html.${ROOT_CLASS} a,
    html.${ROOT_CLASS} .mat-mdc-button-base,
    html.${ROOT_CLASS} .ant-btn-link {
      color: var(--ext-contrast-accent) !important;
    }

    html.${ROOT_CLASS} input,
    html.${ROOT_CLASS} textarea,
    html.${ROOT_CLASS} select,
    html.${ROOT_CLASS} button {
      color: var(--ext-contrast-text) !important;
      font-family: var(--ext-contrast-font-family) !important;
    }

    html.${ROOT_CLASS} .mat-app-background,
    html.${ROOT_CLASS} .mat-drawer-container,
    html.${ROOT_CLASS} .mat-drawer-content,
    html.${ROOT_CLASS} .mat-mdc-card,
    html.${ROOT_CLASS} .mat-mdc-dialog-surface,
    html.${ROOT_CLASS} .mat-mdc-menu-panel,
    html.${ROOT_CLASS} .mat-mdc-select-panel,
    html.${ROOT_CLASS} .mdc-text-field,
    html.${ROOT_CLASS} .ant-layout,
    html.${ROOT_CLASS} .ant-layout-content,
    html.${ROOT_CLASS} .ant-layout-sider,
    html.${ROOT_CLASS} .ant-card,
    html.${ROOT_CLASS} .ant-table,
    html.${ROOT_CLASS} .ant-table-container,
    html.${ROOT_CLASS} .ant-modal-content,
    html.${ROOT_CLASS} .ant-drawer-content,
    html.${ROOT_CLASS} .ant-select-selector,
    html.${ROOT_CLASS} .ant-input,
    html.${ROOT_CLASS} .ant-input-affix-wrapper {
      background-color: var(--ext-contrast-surface) !important;
      color: var(--ext-contrast-text) !important;
      border-color: var(--ext-contrast-border) !important;
    }

    html.${ROOT_CLASS} {
      --mat-app-background-color: var(--ext-contrast-bg);
      --mat-app-text-color: var(--ext-contrast-text);
      --mat-sys-background: var(--ext-contrast-bg);
      --mat-sys-surface: var(--ext-contrast-surface);
      --mat-sys-on-surface: var(--ext-contrast-text);
      --mat-sys-on-background: var(--ext-contrast-text);
      --mat-sys-outline: var(--ext-contrast-border);
      --mdc-theme-background: var(--ext-contrast-bg);
      --mdc-theme-surface: var(--ext-contrast-surface);
      --mdc-theme-on-surface: var(--ext-contrast-text);
      --mdc-filled-text-field-container-color: var(--ext-contrast-surface);
      --mdc-outlined-card-outline-color: var(--ext-contrast-border);
      --ant-color-bg-base: var(--ext-contrast-bg);
      --ant-color-bg-container: var(--ext-contrast-surface);
      --ant-color-bg-elevated: var(--ext-contrast-surface);
      --ant-color-text: var(--ext-contrast-text);
      --ant-color-text-base: var(--ext-contrast-text);
      --ant-color-text-secondary: var(--ext-contrast-muted);
      --ant-color-border: var(--ext-contrast-border);
      --ant-primary-color: var(--ext-contrast-accent);
      --ant-link-color: var(--ext-contrast-accent);
    }

    html.${ROOT_CLASS} img,
    html.${ROOT_CLASS} svg,
    html.${ROOT_CLASS} video,
    html.${ROOT_CLASS} canvas,
    html.${ROOT_CLASS} iframe {
      background-color: transparent !important;
    }

    html.${ROOT_CLASS} *::selection {
      background-color: var(--ext-contrast-accent) !important;
      color: var(--ext-contrast-bg) !important;
    }
  `;
}

function walkAndApply(settings, root = document.body || document.documentElement) {
  if (!root) {
    return;
  }

  if (root instanceof Element) {
    applyInlineOverrides(root, settings);
  }

  const elements = root.querySelectorAll ? root.querySelectorAll("*") : [];
  elements.forEach((element) => applyInlineOverrides(element, settings));
}

function scheduleDomApply() {
  if (scheduledApply || !latestSettings.enabled) {
    return;
  }

  scheduledApply = true;
  window.requestAnimationFrame(() => {
    scheduledApply = false;
    walkAndApply(latestSettings);
  });
}

function startObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          walkAndApply(latestSettings, node);
        }
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function removeStyles() {
  stopObserver();
  document.documentElement.classList.remove(ROOT_CLASS);

  const styleTag = document.getElementById(STYLE_ID);

  if (styleTag) {
    styleTag.remove();
  }

  restoreMarkedElements();
}

function applySettings(settings) {
  latestSettings = { ...DEFAULT_SETTINGS, ...settings };

  if (!latestSettings.enabled) {
    removeStyles();
    return;
  }

  document.documentElement.classList.add(ROOT_CLASS);
  ensureStyleTag().textContent = buildCss(latestSettings);
  restoreMarkedElements();
  walkAndApply(latestSettings);
  startObserver();
  scheduleDomApply();
}

async function loadAndApplySettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  applySettings(settings);
}

chrome.storage.onChanged.addListener((_changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  chrome.storage.sync.get(DEFAULT_SETTINGS).then(applySettings);
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAndApplySettings, { once: true });
} else {
  loadAndApplySettings();
}
