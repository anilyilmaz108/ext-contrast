const DEFAULT_SETTINGS = {
  enabled: true,
  theme: "dark",
  fontScale: 100
};

const THEME_MAP = {
  dark: {
    bg: "#111111",
    surface: "#1a1a1a",
    text: "#ffffff",
    accent: "#ffd400"
  },
  light: {
    bg: "#ffffff",
    surface: "#f5f5f5",
    text: "#111111",
    accent: "#004aad"
  },
  sepia: {
    bg: "#f4ecd8",
    surface: "#e8dcc2",
    text: "#2f2419",
    accent: "#7c4d00"
  },
  blue: {
    bg: "#001b33",
    surface: "#00284c",
    text: "#fff3a3",
    accent: "#8bd3ff"
  }
};

const STYLE_ID = "ext-contrast-style";
const ROOT_CLASS = "ext-contrast-enabled";

function ensureStyleTag() {
  let styleTag = document.getElementById(STYLE_ID);

  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = STYLE_ID;
    document.documentElement.appendChild(styleTag);
  }

  return styleTag;
}

function removeStyles() {
  document.documentElement.classList.remove(ROOT_CLASS);
  const styleTag = document.getElementById(STYLE_ID);

  if (styleTag) {
    styleTag.remove();
  }
}

function buildCss(settings) {
  const theme = THEME_MAP[settings.theme] || THEME_MAP.dark;
  const fontScale = Number(settings.fontScale) / 100;

  return `
    html.${ROOT_CLASS} {
      --ext-contrast-bg: ${theme.bg};
      --ext-contrast-surface: ${theme.surface};
      --ext-contrast-text: ${theme.text};
      --ext-contrast-accent: ${theme.accent};
      --ext-contrast-font-scale: ${fontScale};
    }

    html.${ROOT_CLASS},
    html.${ROOT_CLASS} body {
      background-color: var(--ext-contrast-bg) !important;
      color: var(--ext-contrast-text) !important;
    }

    html.${ROOT_CLASS} body {
      font-size: calc(16px * var(--ext-contrast-font-scale)) !important;
      line-height: 1.6 !important;
    }

    html.${ROOT_CLASS} :is(
      body,
      main,
      article,
      section,
      aside,
      nav,
      header,
      footer,
      div,
      p,
      span,
      a,
      li,
      ul,
      ol,
      dl,
      dt,
      dd,
      table,
      thead,
      tbody,
      tr,
      td,
      th,
      form,
      fieldset,
      legend,
      label,
      button,
      input,
      textarea,
      select,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6
    ) {
      color: var(--ext-contrast-text) !important;
      border-color: var(--ext-contrast-accent) !important;
      font-size: calc(1em * var(--ext-contrast-font-scale)) !important;
    }

    html.${ROOT_CLASS} :is(
      main,
      article,
      section,
      aside,
      nav,
      header,
      footer,
      div,
      table,
      thead,
      tbody,
      tr,
      td,
      th,
      form,
      fieldset,
      button,
      input,
      textarea,
      select
    ) {
      background-color: var(--ext-contrast-surface) !important;
    }

    html.${ROOT_CLASS} a {
      color: var(--ext-contrast-accent) !important;
      text-decoration-thickness: 2px !important;
    }

    html.${ROOT_CLASS} img,
    html.${ROOT_CLASS} video,
    html.${ROOT_CLASS} svg,
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

function applySettings(settings) {
  if (!settings.enabled) {
    removeStyles();
    return;
  }

  document.documentElement.classList.add(ROOT_CLASS);
  ensureStyleTag().textContent = buildCss(settings);
}

async function loadAndApplySettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  applySettings(settings);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
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
