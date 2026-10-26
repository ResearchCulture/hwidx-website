import { API_ROOT, h, namedLink, hwid, pagination } from "./dom.js";

const PAGE_SIZE = 50;

function pageUrl(pageNumber) {
    return pageNumber === 0 ? "/catalog/" : `/catalog/${pageNumber + 1}/`;
}

function renderRow(entry) {
    return h("tr", {},
        h("td", { class: "name-cell" }, h("a", { href: `/${entry.key}/` }, entry.name ?? "(Untitled)")),
        h("td", {}, hwid(entry.key, { link: true })),
        h("td", { class: "secondary-cell" }, entry.org ? namedLink(entry.org) : "—"),
        h("td", { class: "secondary-cell" }, entry.group ? namedLink(entry.group) : "—")
    );
}

function messageRow(text) {
    return h("tr", {}, h("td", { colspan: "4", class: "muted" }, text));
}

async function fetchCatalogPage(pageNumber) {
    // The API is 1-based and returns newest identifiers first by default
    const params = new URLSearchParams({ page: pageNumber + 1, per_page: PAGE_SIZE });
    const response = await fetch(`${API_ROOT}/catalog?${params}`, { headers: { Accept: "application/json" } });
    if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
    }
    return response.json();
}

async function loadCatalog(rows, pager, count) {
    // /catalog/ is page 1, /catalog/2/ is page 2, and so on
    const match = window.location.pathname.match(/^\/catalog\/(\d+)\/?$/);
    const requestedPage = match ? Math.max(parseInt(match[1], 10) - 1, 0) : 0;

    let catalog;
    try {
        catalog = await fetchCatalogPage(requestedPage);

        // Past the end (e.g. an old bookmark after the catalog shrank): show the last page instead
        if (requestedPage >= catalog.pages) {
            catalog = await fetchCatalogPage(catalog.pages - 1);
        }
    } catch (err) {
        console.error(err);
        rows.replaceChildren(messageRow("The index could not be reached just now. Please try again shortly."));
        return;
    }

    count.textContent = `${catalog.count} ${catalog.count === 1 ? "identifier" : "identifiers"}, newest first`;
    rows.replaceChildren(...(catalog.entries.length
        ? catalog.entries.map(renderRow)
        : [messageRow("No devices found.")]
    ));
    pager.replaceChildren(...pagination(catalog.page - 1, catalog.pages, pageUrl));
}

const rows = document.querySelector("[data-catalog-rows]");
const pager = document.querySelector("[data-catalog-pagination]");
const count = document.querySelector("[data-catalog-count]");
if (rows && pager && count) {
    loadCatalog(rows, pager, count);
}
