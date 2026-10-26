import {
    commonQROptions,
    createLogoMarkCanvas,
    createLogoMarkHorizontalCanvas,
    createURLLabelCanvas,
    loadMarkFont,
    renderQRCodeToCanvas,
    createSlimQRCanvas
} from "./mark-types.js";
import { toBraille, brailleSize, renderBrailleCanvas, brailleSvg, downloadBlob, fileStem } from "./braille.js";
import { API_ROOT, h } from "./dom.js";

const LOOKUP_DELAY_MS = 300;
const REGISTER_URL = "https://github.com/ResearchCulture/hwidx";

// An identifier's record from the live index, or null if it isn't there
async function fetchRecord(segs, signal) {
    const response = await fetch(`${API_ROOT}/${segs.map(encodeURIComponent).join("/")}`, {
        signal,
        headers: { Accept: "application/json" },
    });
    if (response.status === 404 || response.status === 400) {
        return null;
    }
    if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
    }
    return response.json();
}

function versionList(record) {
    const slugs = record.children.map((child) => `v${child.slug}`);
    return slugs.length > 8 ? `${slugs.slice(0, 8).join(", ")} and ${slugs.length - 8} more` : slugs.join(", ");
}

// What the index knows about the identifier typed so far, as [kind, content]
async function describeIdentifier(segs, signal) {
    const key = segs.join("/");
    const record = await fetchRecord(segs, signal);

    if (record?.type === "entry") {
        return ["found", [
            `✓ hwidx.org/${key} is registered: `,
            h("strong", {}, record.data.name ?? "(untitled)"),
            ". ",
            h("a", { href: `/${key}/` }, "View its page"),
        ]];
    }

    if (record) {
        if (segs.length === 1) {
            const name = record.data.org?.name ?? `Organisation ${key}`;
            return ["info", [`Organisation ${key}: `, h("strong", {}, name), ` (${record.children.length} devices)`]];
        }
        if (segs.length === 2) {
            const latest = record.children[record.children.length - 1];
            return ["info", [
                `Device ${key}: `, h("strong", {}, latest?.name ?? "(untitled)"),
                record.children.length ? `, with versions ${versionList(record)}` : "",
            ]];
        }
        return ["info", `hwidx.org/${key} is a directory in the index, not a single device.`];
    }

    const register = ["To register it, open a pull request on ", h("a", { href: REGISTER_URL }, "GitHub"), "."];

    if (segs.length === 3) {
        const device = await fetchRecord(segs.slice(0, 2), signal);
        if (device?.type === "directory" && device.children.length) {
            const latest = device.children[device.children.length - 1];
            return ["missing", [
                `hwidx.org/${key} isn't registered yet. Device ${segs[0]}/${segs[1]} is `,
                h("strong", {}, latest.name ?? "(untitled)"), `, with versions ${versionList(device)}. `,
                ...register,
            ]];
        }
    }

    return ["missing", [`hwidx.org/${key} isn't in the index yet. `, ...register]];
}

function createBrowserCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

export async function generateQRCode(target, url, options = {}) {
    if (target instanceof HTMLCanvasElement) {
        await renderQRCodeToCanvas(target, url, options);
        return target;
    }

    if (target instanceof HTMLImageElement) {
        const tempCanvas = createBrowserCanvas(options.width ?? 600, options.height ?? 600);
        await renderQRCodeToCanvas(tempCanvas, url, options);
        target.src = tempCanvas.toDataURL("image/png");
        return target;
    }

    if (typeof target === "string") {
        const tempCanvas = createBrowserCanvas(options.width ?? 600, options.height ?? 600);
        await renderQRCodeToCanvas(tempCanvas, target, options);
        return tempCanvas.toDataURL("image/png");
    }

    throw new TypeError("generateQRCode expects a canvas, an image element, or a URL string.");
}

export function attachLiveQRGenerator(root = document) {
    const form = root.querySelector("[data-qr-generator]");

    if (!form) {
        return;
    }

    const input_org = form.querySelector("[data-qr-org]");
    const input_device = form.querySelector("[data-qr-device]");
    const input_version = form.querySelector("[data-qr-version]");
    const output_url = form.querySelector("[data-qr-output-url]");
    const canvas = form.querySelector("[data-qr-canvas]");
    const downloadLink = form.querySelector("[data-qr-download]");
    const status = form.querySelector("[data-qr-status]");
    const mark_type = form.querySelector("[data-qr-output-style]");
    const lookup = form.querySelector("[data-qr-lookup]");
    const braillePanel = form.querySelector("[data-braille-panel]");
    const brailleCanvas = form.querySelector("[data-braille-canvas]");
    const brailleSummary = form.querySelector("[data-braille-summary]");
    const brailleWarning = form.querySelector("[data-braille-warning]");
    const braillePng = form.querySelector("[data-braille-png]");
    const brailleSvgButton = form.querySelector("[data-braille-svg]");
    let brailleCells = "";
    let brailleText = "";

    // Initial pull from any/all url parameters to pre-fill the form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('o')) {
        input_org.value = urlParams.get('o') ?? '';
    }
    if (urlParams.has('d')) {
        input_device.value = urlParams.get('d') ?? '';
    }
    if (urlParams.has('v')) {
        input_version.value = urlParams.get('v') ?? '';
    }
    if (mark_type instanceof HTMLSelectElement) {
        const initialMarkType = urlParams.get('type') ?? urlParams.get('t') ?? 'bare-qr';
        mark_type.value = initialMarkType;
    }

    if (!(input_org instanceof HTMLInputElement) || !(input_device instanceof HTMLInputElement) || !(input_version instanceof HTMLInputElement) || !(canvas instanceof HTMLCanvasElement)) {
        return;
    }

    function resetPreview() {
        const context = canvas.getContext("2d");
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (downloadLink instanceof HTMLAnchorElement) {
            downloadLink.removeAttribute("href");
        }

        if (braillePanel) {
            braillePanel.hidden = true;
        }
    }

    // The printed short form of the URL (no scheme) in braille, next to the QR code
    async function renderBraille(value) {
        if (!braillePanel || !(brailleCanvas instanceof HTMLCanvasElement)) {
            return;
        }

        brailleText = value.replace(/^https?:\/\//, "").toLowerCase();
        const { cells, unsupported } = toBraille(brailleText);
        brailleCells = cells;

        await renderBrailleCanvas(brailleCanvas, cells);
        brailleCanvas.setAttribute("aria-label", `${brailleText} in braille`);

        const size = brailleSize(cells);
        if (brailleSummary) {
            brailleSummary.textContent = `${brailleText}: ${size.cells} cells, about ${Math.round(size.widthMm)} × ${size.heightMm.toFixed(1)} mm at standard size.`;
        }
        if (brailleWarning) {
            brailleWarning.hidden = unsupported.length === 0;
            brailleWarning.textContent = `These characters have no braille transcription here and were left out: ${unsupported.join(" ")}`;
        }
        if (braillePng instanceof HTMLAnchorElement) {
            braillePng.href = brailleCanvas.toDataURL("image/png");
            braillePng.download = `${fileStem(brailleText)}-braille.png`;
        }
        braillePanel.hidden = false;
    }

    brailleSvgButton?.addEventListener("click", () => {
        if (brailleCells) {
            downloadBlob(new Blob([brailleSvg(brailleCells, `${brailleText} in braille`)], { type: "image/svg+xml" }), `${fileStem(brailleText)}-braille.svg`);
        }
    });

    // Look up the identifier typed so far in the live index, once typing pauses
    let lookupTimer = null;
    let lookupAbort = null;

    function scheduleLookup() {
        if (!lookup) {
            return;
        }

        clearTimeout(lookupTimer);
        lookupAbort?.abort();

        const values = [input_org.value, input_device.value, input_version.value].map((value) => value.trim());
        const segs = values.slice(0, values.indexOf("") === -1 ? 3 : values.indexOf(""));
        if (segs.length === 0) {
            lookup.className = "lookup my-3";
            lookup.replaceChildren();
            return;
        }

        lookupTimer = setTimeout(async () => {
            lookupAbort = new AbortController();
            try {
                const [kind, content] = await describeIdentifier(segs, lookupAbort.signal);
                lookup.className = `lookup my-3 lookup--${kind}`;
                lookup.replaceChildren(...[content].flat());
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error(error);
                    lookup.className = "lookup my-3";
                    lookup.textContent = "Couldn't check the index just now.";
                }
            }
        }, LOOKUP_DELAY_MS);
    }

    const render = async () => {
        const value = `https://hwidx.org/${input_org.value.trim()}/${input_device.value.trim()}/${input_version.value.trim()}`;

        if (output_url instanceof HTMLAnchorElement) {
            output_url.textContent = value;
            output_url.href = value;
        }

        const markType = mark_type instanceof HTMLSelectElement ? mark_type.value : "bare-qr";
        const org = input_org.value.trim();
        const device = input_device.value.trim();
        const version = input_version.value.trim();

        const urlParams = new URLSearchParams(window.location.search);
        if( urlParams.get('type') != markType ) {
            urlParams.set('type', markType);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        }

        if( urlParams.get('o') != org && org.length > 0 ) {
            urlParams.set('o', org);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        }

        if( urlParams.get('d') != device && device.length > 0 ) {
            urlParams.set('d', device);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        }

        if( urlParams.get('v') != version && version.length > 0 ) {
            urlParams.set('v', version);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        }

        if (!Number.isSafeInteger(parseInt(org))) {
            if (status) {
                status.textContent = "Invalid organisation number.";
            }
            input_org.style.borderColor = "red";
            input_org.style.borderWidth = "2px";
            resetPreview();
            return;
        } else {
            input_org.style.borderColor = "";
            input_org.style.borderWidth = "";
        }

        if (!org || !device || !version) {
            if (status) {
                status.textContent = "Missing information...";
            }
            resetPreview();
            return;
        }

        if( !org ) {
            input_org.style.borderColor = "red";
            input_org.style.borderWidth = "2px";
            resetPreview();
            return
        } else {
            input_org.style.borderColor = "";
            input_org.style.borderWidth = "";
        }

        if( !device ) {
            input_device.style.borderColor = "red";
            input_device.style.borderWidth = "2px";
            resetPreview();
            return
        } else {
            input_device.style.borderColor = "";
            input_device.style.borderWidth = "";
        }

        if( !version ) {
            input_version.style.borderColor = "red";
            input_version.style.borderWidth = "2px";
            resetPreview();
            return
        } else {
            input_version.style.borderColor = "";
            input_version.style.borderWidth = "";
        }

        try {
            await loadMarkFont();

            let renderedCanvas;

            switch (markType) {
                case "logo-mark-horizontal":
                    renderedCanvas = await createLogoMarkHorizontalCanvas(createBrowserCanvas, value, { margin: 1 });
                    break;
                case "logo-mark-horizontal-inverted":
                    renderedCanvas = await createLogoMarkHorizontalCanvas(createBrowserCanvas, value, { margin: 1 }, true);
                    break;
                case "logo-mark-vertical":
                    renderedCanvas = await createLogoMarkCanvas(createBrowserCanvas, value, { margin: 1 });
                    break;
                case "label-mark":
                    renderedCanvas = createURLLabelCanvas(createBrowserCanvas, value);
                    break;
                case "slim-qr":
                    renderedCanvas = await createSlimQRCanvas(createBrowserCanvas, value);
                    break;
                case "bare-qr":
                default:
                    renderedCanvas = canvas;
                    await generateQRCode(renderedCanvas, value, { width: 600, margin: 1 });
                    break;
            }

            if (renderedCanvas !== canvas) {
                canvas.width = renderedCanvas.width;
                canvas.height = renderedCanvas.height;

                const destinationContext = canvas.getContext("2d");
                if (destinationContext) {
                    destinationContext.clearRect(0, 0, canvas.width, canvas.height);
                    destinationContext.drawImage(renderedCanvas, 0, 0);
                }
            }

            if (downloadLink instanceof HTMLAnchorElement) {
                downloadLink.href = canvas.toDataURL("image/png");
                downloadLink.download = "hwidx-qr.png";
            }

            await renderBraille(value);

            if (status) {
                status.textContent = "QR code ready.";
            }
        } catch (error) {
            if (status) {
                status.textContent = "Could not generate QR code.";
            }

            console.error(error);
        }
    };

    input_org.addEventListener("input", () => { void render(); scheduleLookup(); });
    input_device.addEventListener("input", () => { void render(); scheduleLookup(); });
    input_version.addEventListener("input", () => { void render(); scheduleLookup(); });
    if (mark_type instanceof HTMLSelectElement) {
        mark_type.addEventListener("change", () => { void render(); });
    }

    void render();
    scheduleLookup();
}

if (typeof window !== "undefined") {
    window.hwidxMarkGenerator = {
        commonQROptions,
        generateQRCode,
        attachLiveQRGenerator,
    };

    window.addEventListener("DOMContentLoaded", () => {
        attachLiveQRGenerator();
    });
}
