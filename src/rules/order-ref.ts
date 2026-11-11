/**
 * The human-facing reference for an order: `#` + the last 8 characters, upper
 * case. Emails, the admin dashboard, the vendor link and the apps all render
 * it from here, because it is the string a customer or vendor quotes when
 * they get in touch. Emails once used the FIRST eight in lower case while
 * admin showed the LAST eight, so a quoted reference could not be found.
 *
 * Changing this changes it for orders already in the wild. Don't.
 */
export function shortId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}
