import { dump } from "js-yaml";
import coerce from "semver/functions/coerce";
import compare from "semver/functions/compare";
import { renderQRCodeToCanvas } from "./mark-types.js";
import {
    toBraille, shortUrl, brailleSize, renderBrailleCanvas, brailleSvg, downloadBlob, fileStem,
} from "./braille.js";
import {
    API_ROOT, h, isLink, linkOrText, namedLink, capitalize,
    hwid, copyButton, breadcrumbs, stateBlock,
} from "./dom.js";

// Entry fields with a dedicated place on the page; everything else is listed generically under Details
const FEATURED_FIELDS = ["name", "description", "url", "status", "org", "group"];

function yamlRecord(data) {
    return h("details", { class: "yaml-record" },
        h("summary", {}, "YAML record"),
        h("pre", {}, dump(data))
    );
}

function identifierBar(key, extra = null) {
    return h("div", { class: "identifier-bar" },
        hwid(key),
        copyButton(`https://hwidx.org/${key}`),
        extra
    );
}

function statusBadge(status) {
    if (typeof status !== "string" || status === "") {
        return null;
    }
    const kind = ["active", "pending"].includes(status.toLowerCase()) ? ` badge--${status.toLowerCase()}` : "";
    return h("span", { class: `badge${kind}` }, status);
}

// Any YAML value as display content: lists, nested maps, links or plain text
function renderValue(value) {
    if (Array.isArray(value)) {
        return h("ul", {}, value.map((item) => h("li", {}, renderValue(item))));
    }

    if (value !== null && typeof value === "object") {
        return h("dl", { class: "kv" }, Object.entries(value).map(([subkey, item]) => [
            h("dt", {}, capitalize(subkey)),
            h("dd", {}, renderValue(item)),
        ]));
    }

    return linkOrText(value);
}

function detailRows(data) {
    const rows = [];
    if (data.org) rows.push(["Organisation", typeof data.org === "object" ? namedLink(data.org) : renderValue(data.org)]);
    if (data.group) rows.push(["Group", typeof data.group === "object" ? namedLink(data.group) : renderValue(data.group)]);
    if (data.url) rows.push(["Documentation", renderValue(data.url)]);
    if (data.status) rows.push(["Status", `${data.status}`]);

    Object.entries(data)
        .filter(([key]) => !key.startsWith("_") && !FEATURED_FIELDS.includes(key))
        .forEach(([key, value]) => rows.push([capitalize(key), renderValue(value)]));

    return rows.length
        ? [h("h2", { class: "section-title" }, "Details"), h("dl", { class: "kv" }, rows.map(([label, value]) => [h("dt", {}, label), h("dd", {}, value)]))]
        : null;
}

// The short URL in braille, with downloads for making raised solder-dot braille on a PCB
function brailleSection(key) {
    const text = shortUrl(key);
    const { cells } = toBraille(text);
    const size = brailleSize(cells);
    const stem = fileStem(text);

    const png = h("button", { type: "button", class: "button secondary small" }, "Download PNG");
    png.addEventListener("click", async () => {
        const canvas = await renderBrailleCanvas(document.createElement("canvas"), cells);
        canvas.toBlob((blob) => blob && downloadBlob(blob, `${stem}-braille.png`), "image/png");
    });

    const svg = h("button", { type: "button", class: "button secondary small" }, "Download SVG (1:1 mm)");
    svg.addEventListener("click", () => {
        downloadBlob(new Blob([brailleSvg(cells, `${text} in braille`)], { type: "image/svg+xml" }), `${stem}-braille.svg`);
    });

    return [
        h("h2", { class: "section-title" }, "Braille"),
        h("div", { class: "braille-strip" },
            h("span", { class: "braille", role: "img", "aria-label": `${text} in braille` }, cells)
        ),
        h("p", { class: "braille-meta" },
            `${text} in Unified English Braille (uncontracted): ${size.cells} cells, about ${Math.round(size.widthMm)} × ${size.heightMm.toFixed(1)} mm at standard size. `,
            h("a", { href: "/braille/" }, "How to make raised braille on a PCB")
        ),
        h("div", { class: "button-row" }, png, svg),
    ];
}

// Previous/next links between a device's versions, plus a pointer to the current one when this isn't it
function versionNav(record) {
    const versions = record.versions;
    if (!versions || versions.count < 2) {
        return null;
    }

    const step = (target, rel, label) => target
        ? h("a", { href: `/${target.key}/`, rel, class: `version-nav__${rel}` }, label(target.slug))
        : h("span", { class: `version-nav__${rel} muted`, "aria-hidden": "true" }, "");

    return [
        h("nav", { class: "version-nav", "aria-label": "Versions of this device" },
            step(versions.previous, "prev", (slug) => `← Previous: v${slug}`),
            h("a", { href: `/${record.parent}/`, class: "version-nav__all" }, `Version ${versions.position} of ${versions.count}`),
            step(versions.next, "next", (slug) => `Next: v${slug} →`)
        ),
        versions.current.key !== record.key
            ? h("p", { class: "notice" },
                "This isn't the current version of this device. ",
                h("a", { href: `/${versions.current.key}/` }, `View the current version (v${versions.current.slug})`),
                ".")
            : null,
    ];
}

const STATS_PERIODS = [["day", "Today"], ["week", "This week"], ["month", "This month"]];

function statCell(stat) {
    return h("td", {},
        h("span", { class: "stat-count" }, `${stat.count}`),
        stat.projected !== stat.count ? h("span", { class: "stat-projected" }, `~${stat.projected} projected`) : null
    );
}

// How often the router has sent visitors on to the documentation, or here to the metapage, this day, week and month.
// Projections are the router's conservative extrapolation of the count so far across the whole period.
function statsSection(stats) {
    if (!stats) {
        return null;
    }

    return [
        h("h2", { class: "section-title" }, "Usage"),
        h("div", { class: "table-wrap" },
            h("table", { class: "data-table stats-table" },
                h("thead", {}, h("tr", {},
                    h("th", { scope: "col" }, "Period"),
                    h("th", { scope: "col" }, "Redirects"),
                    h("th", { scope: "col" }, "Sent to metapage")
                )),
                h("tbody", {}, STATS_PERIODS.map(([period, label]) => h("tr", {},
                    h("th", { scope: "row" }, label),
                    statCell(stats.redirects[period]),
                    statCell(stats.metapage[period])
                )))
            )
        ),
        h("p", { class: "muted small" }, "Visits through hwidx.org that the router sent on to the documentation (redirects) or to this page. Weeks run Monday to Sunday; projections are a cautious estimate from the rate so far, and steady as each period goes on."),
    ];
}

function qrCard(key, parent) {
    const [o, d = "", v = ""] = key.split("/");
    const generator = `/make-a-qr-code/?${new URLSearchParams({ type: "logo-mark-horizontal", o, d, v })}`;
    const canvas = h("canvas", { width: "600", height: "600", "aria-label": `QR code for hwidx.org/${key}`, role: "img" });

    renderQRCodeToCanvas(canvas, `https://hwidx.org/${key}`).catch((err) => console.error("QR render failed", err));

    return h("aside", { class: "card qr-card" },
        canvas,
        h("p", {}, "Scan to open ", h("strong", {}, `hwidx.org/${key}`)),
        h("a", { class: "button secondary small", href: generator }, "Make a label for this device"),
        parent ? h("a", { href: `/${parent}/`, class: "small" }, "All versions") : null
    );
}

function renderEntry(record) {
    const { data } = record;
    const description = data.description === undefined ? [] : [].concat(data.description);
    const pending = typeof data.status === "string" && data.status.toLowerCase() === "pending";

    return [
        breadcrumbs(record.key),
        h("div", { class: "entry-layout" },
            h("div", {},
                h("h1", { class: "page-title" }, data.name ?? `hwidx.org/${record.key}`),
                identifierBar(record.key, [
                    statusBadge(data.status),
                    record.versions?.current.key === record.key ? h("span", { class: "badge badge--latest" }, "Current version") : null,
                ]),
                versionNav(record),
                description.length ? h("div", { class: "lead" }, description.map((line) => h("p", {}, `${line}`))) : null,
                pending ? h("p", { class: "notice" }, "This identifier is pending, so hwidx.org currently sends visitors to this page.") : null,
                isLink(data.url)
                    ? h("div", { class: "button-row" }, h("a", { class: "button", href: data.url }, "Open documentation ↗"))
                    : null,
                detailRows(data),
                statsSection(record.stats),
                brailleSection(record.key),
                yamlRecord(data)
            ),
            qrCard(record.key, record.parent)
        ),
    ];
}

function renderOrg(record) {
    const { org, group } = record.data;

    return [
        breadcrumbs(record.key),
        h("h1", { class: "page-title" }, org ? org.name : `Organisation ${record.key}`),
        group ? h("p", { class: "lead" }, namedLink(group)) : null,
        identifierBar(record.key, org && isLink(org.url) ? h("a", { href: org.url, class: "small" }, "Organisation website ↗") : null),
        h("h2", { class: "section-title" }, "Devices", h("span", { class: "count" }, `${record.children.length}`)),
        record.children.length
            ? h("div", { class: "card-grid" }, record.children.map((child) =>
                h("a", { class: "card card-link", href: `/${child.key}/` },
                    h("span", { class: "card-link__title" }, child.name ?? `Device ${child.slug}`),
                    hwid(child.key)
                )
            ))
            : h("p", { class: "muted" }, "No devices registered yet."),
        statsSection(record.stats),
        Object.keys(record.data).length ? yamlRecord(record.data) : null,
    ];
}

// Newest first, by the same rules as the router's "current version": semver with prereleases kept
// (1.2-rc0 comes before 1.2), non-versions last, ties in numeric-aware text order
function bySemverDescending(a, b) {
    if (a.semver && b.semver) {
        const order = compare(b.semver, a.semver);
        if (order !== 0) return order;
    } else if (a.semver || b.semver) {
        return a.semver ? -1 : 1;
    }
    return b.slug.localeCompare(a.slug, undefined, { numeric: true });
}

function renderDevice(record) {
    const { org, group } = record.data;
    const versions = record.children
        .map((child) => ({ ...child, semver: coerce(child.slug, { includePrerelease: true }) }))
        .sort(bySemverDescending);
    const latest = versions[0];

    return [
        breadcrumbs(record.key),
        h("h1", { class: "page-title" }, latest?.name ?? `Device ${record.key}`),
        org ? h("p", { class: "lead" }, namedLink(org), group ? [" · ", namedLink(group)] : null) : null,
        identifierBar(record.key),
        latest
            ? h("div", { class: "button-row" },
                h("a", { class: "button", href: `/${latest.key}/` }, `View the latest version (v${latest.slug})`)
            )
            : null,
        h("h2", { class: "section-title" }, "Versions", h("span", { class: "count" }, `${versions.length}`)),
        versions.length
            ? h("ul", { class: "list-rows" }, versions.map((child, i) =>
                h("li", {}, h("a", { href: `/${child.key}/` },
                    h("span", { class: "hwid" }, `v${child.slug}`),
                    h("span", { class: "grow" }, child.name ?? `Version ${child.slug}`),
                    i === 0 ? h("span", { class: "badge badge--latest" }, "Latest") : null
                ))
            ))
            : h("p", { class: "muted" }, "No versions found."),
        statsSection(record.stats),
        Object.keys(record.data).length ? yamlRecord(record.data) : null,
    ];
}

function renderDirectory(record) {
    return [
        breadcrumbs(record.key),
        h("h1", { class: "page-title" }, `hwidx.org/${record.key}`),
        identifierBar(record.key),
        h("h2", { class: "section-title" }, "Entries", h("span", { class: "count" }, `${record.children.length}`)),
        record.children.length
            ? h("ul", { class: "list-rows" }, record.children.map((child) =>
                h("li", {}, h("a", { href: `/${child.key}/` },
                    h("span", { class: "hwid" }, child.slug),
                    h("span", { class: "grow" }, child.name ?? "")
                ))
            ))
            : h("p", { class: "muted" }, "No entries found."),
        statsSection(record.stats),
        Object.keys(record.data).length ? yamlRecord(record.data) : null,
    ];
}

function render(record) {
    if (record.type === "entry") {
        return renderEntry(record);
    }

    // Directory depth: 1 = organisation, 2 = device, deeper = plain index
    switch (record.key.split("/").length) {
        case 1: return renderOrg(record);
        case 2: return renderDevice(record);
        default: return renderDirectory(record);
    }
}

async function loadMetapage(root) {
    const key = window.location.pathname.replace(/^\/+|\/+$/g, "");
    document.title = `hwidx.org/${key} · hwidx.org – The Hardware Index`;

    let content;
    try {
        const response = await fetch(`${API_ROOT}/${key}`, { headers: { Accept: "application/json" } });

        if (response.status === 404 || response.status === 400) {
            content = stateBlock("Not in the index", `There is no hwidx entry for hwidx.org/${key}.`, [
                h("a", { class: "button", href: `/search/?${new URLSearchParams({ q: key })}` }, "Search for it"),
                h("a", { class: "button secondary", href: "/catalog/" }, "Browse the catalog"),
            ]);
        } else if (!response.ok) {
            throw new Error(`API responded with ${response.status}`);
        } else {
            const record = await response.json();
            const name = record.data?.name;
            if (name) {
                document.title = `${name} (hwidx.org/${key}) · hwidx.org – The Hardware Index`;
            }
            content = render(record);
        }
    } catch (err) {
        console.error(err);
        content = stateBlock("Index unavailable", "The index could not be reached just now. Please try again shortly.", [
            h("a", { class: "button", href: window.location.pathname }, "Try again"),
        ]);
    }

    root.replaceChildren(...[content].flat(Infinity).filter((node) => node !== null && node !== undefined));
}

const root = document.querySelector("[data-metapage]");
if (root) {
    loadMetapage(root);
}
