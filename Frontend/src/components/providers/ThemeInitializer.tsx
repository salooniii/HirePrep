"use client";

/**
 * ThemeInitializer
 * Injects a blocking <script> that reads localStorage and applies
 * data-theme to <html> BEFORE React hydrates — eliminates flash of wrong theme.
 */
export default function ThemeInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  try {
    var stored = localStorage.getItem('hireprep-theme');
    var parsed = stored ? JSON.parse(stored) : null;
    var theme  = parsed && parsed.state && parsed.state.theme ? parsed.state.theme : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
        `.trim(),
      }}
    />
  );
}
