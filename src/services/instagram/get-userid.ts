export function getUserIdFromPage() {
  const html = document.documentElement.innerHTML
  const match = html.match(/"profilePage_([0-9]+)"/)
  return match ? match[1] : null
}
