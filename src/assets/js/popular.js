import { API_ROOT, h, hwid, isLink } from "./dom.js";

// The home page's list of the most used identifiers this week, from the router's usage stats.
// Each row links to the identifier's metapage, and straight to its documentation when the router
// currently redirects there (not via hwidx.org, so clicks from here don't feed back into the counts).
function renderRow(entry) {
    return h("tr", {},
        h("td", { class: "name-cell" }, h("a", { href: `/${entry.key}/` }, entry.name ?? `hwidx.org/${entry.key}`)),
        h("td", {}, hwid(entry.key)),
        h("td", { class: "popular-links" },
            h("a", { href: `/${entry.key}/` }, "Metapage"),
            isLink(entry.redirect) ? h("a", { href: entry.redirect, rel: "noopener" }, "Documentation") : null
        ),
        h("td", { class: "number-cell" }, `${entry.total}`)
    );
}

async function loadPopular(root) {
    let popular;
    try {
        const response = await fetch(`${API_ROOT}/popular?period=week`, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new Error(`API responded with ${response.status}`);
        }
        popular = await response.json();
    } catch (err) {
        console.error(err);
        root.replaceChildren(h("p", { class: "muted" }, "Popular identifiers could not be loaded just now."));
        return;
    }

    if (popular.entries.length === 0) {
        root.replaceChildren(h("p", { class: "muted" }, "No identifiers have been visited yet this week."));
        return;
    }

    root.replaceChildren(h("div", { class: "table-wrap" },
        h("table", { class: "data-table popular-table" },
            h("thead", {}, h("tr", {},
                h("th", { scope: "col" }, "Name"),
                h("th", { scope: "col" }, "Identifier"),
                h("th", { scope: "col" }, "Links"),
                h("th", { scope: "col", class: "number-cell" }, "Visits")
            )),
            h("tbody", {}, popular.entries.map(renderRow))
        )
    ));
}

const root = document.querySelector("[data-popular]");
if (root) {
    loadPopular(root);
}
