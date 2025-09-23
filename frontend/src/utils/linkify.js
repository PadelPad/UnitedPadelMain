export function escapeHtml(s = '') {
  return s.replace(/[&<>\"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[c]));
}
export function linkifyContent(text = '') {
  const safe = escapeHtml(text);
  const withMentions = safe.replace(/@([A-Za-z0-9_.]+)/g, '<a href="/profile/$1" class="text-orange-300 hover:underline">@$1</a>');
  return withMentions.replace(/#([A-Za-z0-9_.]+)/g, '<a href="/social?tag=$1" class="text-orange-300 hover:underline">#$1</a>');
}
