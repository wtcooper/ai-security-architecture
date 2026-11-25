/**
 * Opens the site search (the ⌘K palette the header owns) from anywhere on a page: a search box
 * in a page's own content dispatches this event and the header, which listens for it, opens.
 */
export const OPEN_SEARCH_EVENT = "site-search:open";

export const openSiteSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
