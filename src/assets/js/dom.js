// Proxied to the hwidx-router container by nginx, so this is always same-origin
export const API_ROOT = "/api/v1";

// Minimal element builder. Dataset values are only ever added as text nodes, never as HTML.
export function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) {
        if (value !== null && value !== undefined && value !== false) {
            el.setAttribute(name, value === true ? "" : value);
        }
    }
    el.append(...children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false));
    return el;
}

export function isLink(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function linkOrText(value) {
    return isLink(value) ? h("a", { href: value }, value) : `${value}`;
}

export function namedLink(item) {
    return isLink(item.url) ? h("a", { href: item.url }, item.name) : `${item.name}`;
}

export function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// An identifier chip, e.g. hwidx.org/1/0/0.9, optionally linking to its metapage
export function hwid(key, { link = false } = {}) {
    const label = `hwidx.org/${key}`;
    return link ? h("a", { class: "hwid", href: `/${key}/` }, label) : h("span", { class: "hwid" }, label);
}

// Copies text to the clipboard, briefly confirming on the button itself
export function copyButton(text, label = "Copy link") {
    const button = h("button", { type: "button", class: "copy-button" }, label);
    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(text);
            button.textContent = "Copied";
        } catch {
            button.textContent = "Copy failed";
        }
        setTimeout(() => { button.textContent = label; }, 2000);
    });
    return button;
}

// hwidx.org › 1 › 0 › 0.9, each ancestor linking to its own metapage
export function breadcrumbs(key) {
    const segs = key.split("/");
    const crumbs = [h("a", { href: "/" }, "hwidx.org")];
    segs.forEach((seg, i) => {
        crumbs.push(h("span", { class: "sep", "aria-hidden": "true" }, "/"));
        crumbs.push(i === segs.length - 1
            ? h("span", { "aria-current": "page" }, seg)
            : h("a", { href: `/${segs.slice(0, i + 1).join("/")}/` }, seg));
    });
    return h("nav", { class: "breadcrumbs", "aria-label": "Breadcrumb" }, crumbs);
}

// Numbered page links; pageUrl(n) gives the URL for 0-based page n
export function pagination(pageNumber, pageCount, pageUrl) {
    if (pageCount <= 1) {
        return [];
    }

    const links = [];
    if (pageNumber > 0) {
        links.push(h("a", { href: pageUrl(pageNumber - 1), rel: "prev" }, "← Previous"));
    }
    for (let i = 0; i < pageCount; i++) {
        links.push(h("a", { href: pageUrl(i), "aria-current": i === pageNumber ? "page" : null }, `${i + 1}`));
    }
    if (pageNumber < pageCount - 1) {
        links.push(h("a", { href: pageUrl(pageNumber + 1), rel: "next" }, "Next →"));
    }
    return links;
}

// A centred empty/error state with a title, message and optional action buttons
export function stateBlock(title, message, actions = []) {
    return h("div", { class: "state" },
        h("h1", { class: "page-title" }, title),
        h("p", { class: "muted" }, message),
        actions.length ? h("div", { class: "button-row" }, actions) : null
    );
}

export function loading(text = "Loading…") {
    return h("p", { class: "loading", role: "status" }, text);
}
