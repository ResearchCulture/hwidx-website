// Braille rendering of hwidx URLs, for raised solder-dot braille on PCBs (see /braille/).
//
// Text is transcribed to Unicode braille cells as Unified English Braille, uncontracted (grade 1),
// and the cells are drawn with the "Braille CC0" font. The font's own ASCII mapping isn't used, as it
// doesn't follow UEB (no numeric indicator, single-cell slash), but its Unicode braille glyphs are exact.

export const BRAILLE_FONT_FAMILY = "Braille CC0";

// Physical geometry, taken from the font (1000 units/em: 200-unit dot pitch, 125-unit dots, 500-unit cells)
// at a 12.5 mm em, which lands on standard braille spacing.
export const BRAILLE_MM = {
    dotPitch: 2.5,
    cellPitch: 6.25,
    dotDiameter: 1.5625,
};

const LETTERS = {
    a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
    k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞",
    u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽", z: "⠵",
};

// Digits are the letters a-j after a numeric indicator
const DIGITS = { 1: "⠁", 2: "⠃", 3: "⠉", 4: "⠙", 5: "⠑", 6: "⠋", 7: "⠛", 8: "⠓", 9: "⠊", 0: "⠚" };

const SYMBOLS = {
    ".": "⠲", "/": "⠸⠌", "-": "⠤", "_": "⠨⠤", ":": "⠒", "?": "⠦", ",": "⠂",
    "&": "⠈⠯", "=": "⠐⠶", "+": "⠐⠖", "#": "⠸⠹", "%": "⠨⠴", "@": "⠈⠁", "~": "⠈⠔",
};

const NUMERIC_INDICATOR = "⠼";
const GRADE1_SYMBOL = "⠰";        // before a-j straight after a number, so they read as letters
const GRADE1_WORD = "⠰⠰";         // the whole URL is uncontracted
const CAPITAL = "⠠";

// UEB grade 1 transcription. Returns the braille cells and any characters that couldn't be transcribed.
export function toBraille(text) {
    let cells = GRADE1_WORD;
    let numeric = false;
    const unsupported = [];

    for (const ch of text) {
        if (ch in DIGITS) {
            if (!numeric) cells += NUMERIC_INDICATOR;
            cells += DIGITS[ch];
            numeric = true;
            continue;
        }

        // A full stop or comma between digits is a decimal point/separator and stays in numeric mode
        if ((ch === "." || ch === ",") && numeric) {
            cells += SYMBOLS[ch];
            continue;
        }

        const lower = ch.toLowerCase();
        if (lower in LETTERS) {
            if (ch !== lower) {
                cells += CAPITAL;
            } else if (numeric && "abcdefghij".includes(lower)) {
                cells += GRADE1_SYMBOL;
            }
            cells += LETTERS[lower];
        } else if (ch in SYMBOLS) {
            cells += SYMBOLS[ch];
        } else {
            unsupported.push(ch);
        }
        numeric = false;
    }

    return { cells, unsupported: [...new Set(unsupported)] };
}

// The short printed form of an identifier's URL, e.g. hwidx.org/1/0/0.9
export function shortUrl(key) {
    return `hwidx.org/${key}`.toLowerCase();
}

export function brailleSize(cells) {
    const count = [...cells].length;
    return {
        cells: count,
        widthMm: (count - 1) * BRAILLE_MM.cellPitch + BRAILLE_MM.dotPitch + BRAILLE_MM.dotDiameter,
        heightMm: 2 * BRAILLE_MM.dotPitch + BRAILLE_MM.dotDiameter,
    };
}

export async function loadBrailleFont() {
    if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.load(`100px "${BRAILLE_FONT_FAMILY}"`, "⠿");
    }
}

// Black dots on white, drawn with the braille font; fontSize is px per em (a cell is half an em)
export async function renderBrailleCanvas(canvas, cells, { fontSize = 160 } = {}) {
    await loadBrailleFont();

    const count = [...cells].length;
    const pad = Math.round(fontSize * 0.15);

    // In each glyph the dots span x 0.088-0.413em and sit 0.188-0.713em above the baseline;
    // size the canvas to the dots plus padding rather than to the glyph boxes
    canvas.width = Math.ceil(pad * 2 + (count - 1) * fontSize * 0.5 + fontSize * 0.325);
    canvas.height = Math.ceil(pad * 2 + fontSize * 0.525);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = `${fontSize}px "${BRAILLE_FONT_FAMILY}"`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(cells, pad - fontSize * 0.088, pad + fontSize * 0.713);
    return canvas;
}

// A 1:1 scale SVG (millimetres) of the dot pattern, e.g. for importing as solder mask openings in KiCad
export function brailleSvg(cells, title = "") {
    const margin = 1;
    const r = BRAILLE_MM.dotDiameter / 2;
    const { widthMm, heightMm } = brailleSize(cells);
    const width = widthMm + margin * 2;
    const height = heightMm + margin * 2;
    const round = (n) => Math.round(n * 10000) / 10000;

    const dots = [];
    [...cells].forEach((cell, i) => {
        const bits = cell.codePointAt(0) - 0x2800;
        for (let dot = 0; dot < 6; dot++) {
            if (bits & (1 << dot)) {
                const cx = margin + r + i * BRAILLE_MM.cellPitch + (dot < 3 ? 0 : BRAILLE_MM.dotPitch);
                const cy = margin + r + (dot % 3) * BRAILLE_MM.dotPitch;
                dots.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}"/>`);
            }
        }
    });

    const safeTitle = title.replace(/[<>&"]/g, "");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${round(width)}mm" height="${round(height)}mm" viewBox="0 0 ${round(width)} ${round(height)}">
<title>${safeTitle}</title>
<g fill="black">
${dots.join("\n")}
</g>
</svg>
`;
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// File-name friendly form of a URL, e.g. hwidx.org-1-0-0.9
export function fileStem(text) {
    return text.replace(/[^a-z0-9.]+/gi, "-").replace(/^-+|-+$/g, "");
}
