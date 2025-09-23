let navFn = null;

export function setNavigate(fn) {
  navFn = fn;
}

export function navigateTo(path) {
  if (navFn) navFn(path);
  else {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}
