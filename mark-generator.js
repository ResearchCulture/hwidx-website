const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream/promises");
const { createCanvas, registerFont } = require("canvas");

const SHARED_MARK_TYPES_BUNDLE = path.join(__dirname, "_site/assets/js/mark-types.js");
let markTypesModulePromise;

function commonQROptions(options = {}) {
    return {
        errorCorrectionLevel: "L",
        type: "image/png",
        margin: 1,
        width: 600,
        height: 600,
        ...options,
    };
}

function getNodeCanvasFactory() {
    return (width, height) => createCanvas(width, height);
}

function loadSharedMarkTypes() {
    if (!markTypesModulePromise) {
        markTypesModulePromise = fs.promises.readFile(SHARED_MARK_TYPES_BUNDLE, "utf8").then((source) => {
            return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
        });
    }

    return markTypesModulePromise;
}

async function saveToFile(filePath, canvas) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const out = fs.createWriteStream(filePath);
    await pipeline(canvas.createPNGStream(), out);
}

registerFont("src/assets/fonts/FredokaOne-Regular.ttf", {
    family: "Fredoka One",
    weight: "bold",
});

async function generateQRCode(filePath, url, options = {}) {
    const { renderQRCodeToCanvas } = await loadSharedMarkTypes();
    const qrSize = options.width ?? 600;
    const canvas = createCanvas(qrSize, options.height ?? qrSize);

    await renderQRCodeToCanvas(canvas, url, commonQROptions(options));
    await saveToFile(filePath, canvas);
}

async function generateLogoMark(filePath, url, options = {}) {
    const { createLogoMarkCanvas } = await loadSharedMarkTypes();
    const canvas = await createLogoMarkCanvas(getNodeCanvasFactory(), url, options);
    await saveToFile(filePath, canvas);
}

async function generateLogoMarkHorizontal(filePath, url, options = {}, invert = false) {
    const { createLogoMarkHorizontalCanvas } = await loadSharedMarkTypes();
    const canvas = await createLogoMarkHorizontalCanvas(getNodeCanvasFactory(), url, options, invert);
    await saveToFile(filePath, canvas);
}

async function generateURLLabel(filePath, url) {
    const { createURLLabelCanvas } = await loadSharedMarkTypes();
    const canvas = createURLLabelCanvas(getNodeCanvasFactory(), url);
    await saveToFile(filePath, canvas);
    return canvas;
}

module.exports = {
    qrCode: generateQRCode,
    logoMark: generateLogoMark,
    logoMarkHorizontal: generateLogoMarkHorizontal,
    labelMark: generateURLLabel,
};