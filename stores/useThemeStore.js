"use client";

import { create } from "zustand";
import {
  DEFAULT_THEME_ID,
  applyThemeToDocument,
  broadcastThemeChange,
  getThemeById,
  persistThemeId,
  readSavedThemeId,
} from "@/lib/themes";
import {
  DEFAULT_FONT_ID,
  applyFontToDocument,
  broadcastFontChange,
  getFontById,
  persistFontId,
  readSavedFontId,
} from "@/lib/fonts";

const useThemeStore = create((set) => ({
  themeId: DEFAULT_THEME_ID,
  fontId: DEFAULT_FONT_ID,
  hydrated: false,
  initTheme: () => {
    const theme = getThemeById(readSavedThemeId());
    const font = getFontById(readSavedFontId());
    applyThemeToDocument(theme);
    applyFontToDocument(font);
    set({ themeId: theme.id, fontId: font.id, hydrated: true });
  },
  setTheme: (themeId) => {
    const theme = getThemeById(themeId);
    persistThemeId(theme.id);
    applyThemeToDocument(theme);
    broadcastThemeChange(theme);
    set({ themeId: theme.id, hydrated: true });
  },
  setFont: (fontId) => {
    const font = getFontById(fontId);
    persistFontId(font.id);
    applyFontToDocument(font);
    broadcastFontChange(font);
    set({ fontId: font.id, hydrated: true });
  },
  applyExternalTheme: (themeId) => {
    const theme = getThemeById(themeId);
    applyThemeToDocument(theme);
    set({ themeId: theme.id, hydrated: true });
  },
  applyExternalFont: (fontId) => {
    const font = getFontById(fontId);
    applyFontToDocument(font);
    set({ fontId: font.id, hydrated: true });
  },
}));

export default useThemeStore;
