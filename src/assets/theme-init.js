(function () {
  try {
    const key = 'theme';
    const saved = localStorage.getItem(key); // 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = saved ? saved === 'dark' : prefersDark;
    const root = document.documentElement;
    root.classList.toggle('dark', useDark);
  } catch (_) {}
})();
