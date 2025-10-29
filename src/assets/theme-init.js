(function () {
  try {
    const key = 'theme';
    const saved = sessionStorage.getItem(key); // 'light' | 'dark' | null
    
    // If no saved preference, set dark mode as default in session storage
    if (!saved) {
      sessionStorage.setItem(key, 'dark');
    }
    
    const useDark = saved ? saved === 'dark' : true;
    const root = document.documentElement;
    root.classList.toggle('dark', useDark);
  } catch (_) {}
})();
