/** Any button on the page can summon the request sheet. */
export function openRequestSheet() {
  window.dispatchEvent(new Event("open-request-sheet"));
}
