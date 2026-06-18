import {
    commonQROptions,
    createLogoMarkCanvas,
    createLogoMarkHorizontalCanvas,
    createURLLabelCanvas,
    renderQRCodeToCanvas,
} from "./mark-types.js";

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

    input_org.addEventListener("input", () => { void render(); });
    input_device.addEventListener("input", () => { void render(); });
    input_version.addEventListener("input", () => { void render(); });
    if (mark_type instanceof HTMLSelectElement) {
        mark_type.addEventListener("change", () => { void render(); });
    }

    void render();
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