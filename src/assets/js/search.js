import { API_ROOT, h, hwid, pagination, loading } from "./dom.js";

const PAGE_SIZE = 20;
const FIELDS = ["all", "name", "org", "id"];
const FIELD_LABELS = { name: " in device names", org: " in organisations", id: " in identifiers" };

// The text split into plain strings and <mark>ed matches of any search term
function highlight(text, terms) {
    const lower = text.toLowerCase();
    const marked = new Array(text.length).fill(false);
    for (const term of terms) {
        for (let at = lower.indexOf(term); term && at !== -1; at = lower.indexOf(term, at + term.length)) {
            marked.fill(true, at, at + term.length);
        }
    }

    const parts = [];
    let start = 0;
    for (let i = 1; i <= text.length; i++) {
        if (i === text.length || marked[i] !== marked[start]) {
            const slice = text.slice(start, i);
            parts.push(marked[start] ? h("mark", {}, slice) : slice);
            start = i;
        }
    }
    return parts;
}

// org and group are usually { name, url }, but a plain string is accepted too
function displayName(value) {
    return typeof value === "string" ? value : value?.name;
}

function renderResult(entry, terms) {
    const name = entry.name ?? "(Untitled)";
    const org = displayName(entry.org);
    const group = displayName(entry.group);
    return h("li", {},
        h("a", { class: "card result", href: `/${entry.key}/` },
            h("div", { class: "result__title" },
                highlight(name, terms),
                entry.current ? h("span", { class: "badge badge--latest" }, "Current version") : null
            ),
            h("div", { class: "result__meta" },
                hwid(entry.key),
                org ? h("span", {}, highlight(org, terms)) : null,
                group ? h("span", {}, highlight(group, terms)) : null
            )
        )
    );
}

// Matching organisations as cards linking to their pages, above the device results
function renderOrganisations(organisations, terms) {
    return [
        h("h2", { class: "section-title" }, "Organisations", h("span", { class: "count" }, `${organisations.length}`)),
        h("div", { class: "card-grid" }, organisations.map((organisation) =>
            h("a", { class: "card card-link", href: `/${organisation.key}/` },
                h("span", { class: "card-link__title" }, highlight(organisation.name, terms)),
                organisation.groups.length
                    ? h("span", { class: "muted small" }, highlight(organisation.groups.join(" · "), terms))
                    : null,
                h("span", { class: "result__meta" },
                    hwid(organisation.key),
                    `${organisation.entries} ${organisation.entries === 1 ? "identifier" : "identifiers"}`
                )
            )
        )),
        h("h2", { class: "section-title" }, "Devices"),
    ];
}

async function fetchResults(q, field, pageNumber) {
    const params = new URLSearchParams({ q, field, page: pageNumber + 1, per_page: PAGE_SIZE });
    const response = await fetch(`${API_ROOT}/search?${params}`, { headers: { Accept: "application/json" } });
    if (response.status === 400) {
        return null;
    }
    if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
    }
    return response.json();
}

function pageUrl(q, field) {
    return (pageNumber) => {
        const params = new URLSearchParams({ q });
        if (field !== "all") params.set("field", field);
        if (pageNumber > 0) params.set("page", pageNumber + 1);
        return `/search/?${params}`;
    };
}

async function loadSearch(form, status, organisationsSection, results, pager) {
    const params = new URLSearchParams(window.location.search);
    const q = (params.get("q") ?? "").trim();
    const field = FIELDS.includes(params.get("field")) ? params.get("field") : "all";
    const requestedPage = Math.max((parseInt(params.get("page"), 10) || 1) - 1, 0);

    form.elements.q.value = q;
    form.elements.field.value = field;

    // Changing where to search re-runs the current query
    form.elements.field.addEventListener("change", () => {
        if (form.elements.q.value.trim()) {
            form.requestSubmit();
        }
    });

    if (!q) {
        return;
    }

    document.title = `“${q}” · Search · hwidx.org – The Hardware Index`;
    status.replaceChildren(loading("Searching…"));

    let found;
    try {
        found = await fetchResults(q, field, requestedPage);

        // Past the end (e.g. a stale link): show the last page instead
        if (found && found.count > 0 && requestedPage >= found.pages) {
            found = await fetchResults(q, field, found.pages - 1);
        }
    } catch (err) {
        console.error(err);
        status.textContent = "The index could not be reached just now. Please try again shortly.";
        return;
    }

    if (found === null) {
        status.textContent = "That search couldn't be run. Searches can be up to 200 characters long.";
        return;
    }

    if (found.count === 0) {
        status.replaceChildren(
            `No results for “${q}”${FIELD_LABELS[field] ?? ""}. Try fewer words, or `,
            h("a", { href: "/catalog/" }, "browse the catalog"),
            "."
        );
        return;
    }

    const pageNote = found.pages > 1 ? ` · page ${found.page} of ${found.pages}` : "";
    status.textContent = `${found.count} ${found.count === 1 ? "result" : "results"} for “${q}”${FIELD_LABELS[field] ?? ""}${pageNote}`;

    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

    // Organisation cards only on the first page, so paging through devices doesn't repeat them
    const organisations = found.page === 1 ? found.organisations ?? [] : [];
    organisationsSection.hidden = organisations.length === 0;
    organisationsSection.replaceChildren(...(organisations.length ? renderOrganisations(organisations, terms) : []));

    results.replaceChildren(...found.entries.map((entry) => renderResult(entry, terms)));
    pager.replaceChildren(...pagination(found.page - 1, found.pages, pageUrl(q, field)));
}

const form = document.querySelector("[data-search-form]");
const status = document.querySelector("[data-search-status]");
const organisationsSection = document.querySelector("[data-search-organisations]");
const results = document.querySelector("[data-search-results]");
const pager = document.querySelector("[data-search-pagination]");
if (form && status && organisationsSection && results && pager) {
    loadSearch(form, status, organisationsSection, results, pager);
}
