import QRCode from "qrcode";

const DEFAULT_FONT = '"Fredoka One", sans-serif';

export function commonQROptions(options = {}) {
	return {
		errorCorrectionLevel: "L",
		margin: 1,
		width: 600,
		height: 600,
		...options,
	};
}

function roundedRectPath(ctx, x, y, width, height, radius) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}

function fitTextSize(ctx, text, maxWidth, startSize, minSize = 10, fontFamily = DEFAULT_FONT) {
	let size = startSize;
	ctx.font = `bold ${size}px ${fontFamily}`;
	while (ctx.measureText(text).width > maxWidth && size > minSize) {
		size -= 1;
		ctx.font = `bold ${size}px ${fontFamily}`;
	}
	return size;
}

export async function renderQRCodeToCanvas(canvas, url, options = {}) {
	const qrOptions = commonQROptions(options);
	await QRCode.toCanvas(canvas, url, qrOptions);
	if (typeof canvas.removeAttribute === "function") {
		canvas.removeAttribute("style");
	}
	return canvas;
}

export async function createLogoMarkCanvas(createCanvas, url, options = {}) {
	const qrOptions = commonQROptions(options);

	const qrSize = 600;
	const borderWidth = 30;
	const textBarHeight = 100;
	const fontHeight = 90;
	const totalWidth = qrSize + borderWidth * 2;
	const totalHeight = qrSize + borderWidth * 2 + textBarHeight * 2;
	const cornerRadius = fontHeight / 2;

	const qrCanvas = createCanvas(qrSize, qrSize);
	await QRCode.toCanvas(qrCanvas, url, {
		...qrOptions,
		width: qrSize,
	});

	const finalCanvas = createCanvas(totalWidth, totalHeight);
	const ctx = finalCanvas.getContext("2d");

	ctx.fillStyle = "black";
	roundedRectPath(ctx, 0, 0, totalWidth, totalHeight, cornerRadius);
	ctx.fill();

	const qrX = borderWidth;
	const qrY = borderWidth + textBarHeight;
	const qrCornerRadius = cornerRadius - borderWidth;

	ctx.save();
	roundedRectPath(ctx, qrX, qrY, qrSize, qrSize, qrCornerRadius);
	ctx.clip();
	ctx.drawImage(qrCanvas, qrX, qrY);
	ctx.restore();

	ctx.fillStyle = "white";
	ctx.font = `bold ${fontHeight}px ${DEFAULT_FONT}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillText("hwidx.org", totalWidth / 2, textBarHeight / 2 + fontHeight / 7);

	const shortURL = url.replace("https://hwidx.org", "");
	ctx.fillText(shortURL, totalWidth / 2, totalHeight - textBarHeight / 2 - fontHeight / 7);

	return finalCanvas;
}

export async function createLogoMarkHorizontalCanvas(createCanvas, url, options = {}, invert = false) {
	const qrOptions = commonQROptions(options);

	const qrSize = 800;
	const borderWidth = 50;
	const cornerRadius = 100;
	const fontHeight = (qrSize * 0.5) / 2;
	const textPadding = 100;
	const shortURL = url.replace("https://hwidx.org", "");

	const tempCanvas = createCanvas(100, 100);
	const tempCtx = tempCanvas.getContext("2d");
	tempCtx.font = `bold ${fontHeight}px ${DEFAULT_FONT}`;

	const topTextWidth = tempCtx.measureText("hwidx.org").width;
	const bottomTextWidth = tempCtx.measureText(shortURL).width;
	const textBoxWidth = Math.max(topTextWidth, bottomTextWidth) + textPadding;

	const totalWidth = textBoxWidth + qrSize + borderWidth * 3;
	const totalHeight = qrSize + borderWidth * 2;

	const qrCanvas = createCanvas(qrSize, qrSize);
	await QRCode.toCanvas(qrCanvas, url, {
		...qrOptions,
		width: qrSize,
	});

	const finalCanvas = createCanvas(totalWidth, totalHeight);
	const ctx = finalCanvas.getContext("2d");

	ctx.fillStyle = "black";
	roundedRectPath(ctx, 0, 0, totalWidth, totalHeight, cornerRadius);
	ctx.fill();

	const whiteBoxX = borderWidth;
	const whiteBoxY = borderWidth;
	const whiteBoxCornerRadius = cornerRadius - borderWidth;

	ctx.fillStyle = invert ? "black" : "white";
	roundedRectPath(ctx, whiteBoxX, whiteBoxY, textBoxWidth, qrSize, whiteBoxCornerRadius);
	ctx.fill();

	const qrX = borderWidth * 2 + textBoxWidth;
	const qrY = borderWidth;
	const qrCornerRadius = cornerRadius - borderWidth;

	ctx.save();
	roundedRectPath(ctx, qrX, qrY, qrSize, qrSize, qrCornerRadius);
	ctx.clip();
	ctx.drawImage(qrCanvas, qrX, qrY);
	ctx.restore();

	ctx.fillStyle = invert ? "white" : "black";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	const textCenterX = borderWidth + textBoxWidth / 2;
	const textCenterY = totalHeight / 2;
	const maxTextWidth = textBoxWidth - textPadding;

	const topFontSize = fitTextSize(ctx, "hwidx.org", maxTextWidth, fontHeight);
	ctx.font = `bold ${topFontSize}px ${DEFAULT_FONT}`;
	ctx.fillText("hwidx.org", textCenterX, textCenterY - topFontSize / 2 - 10);

	const bottomFontSize = fitTextSize(ctx, shortURL, maxTextWidth, fontHeight);
	ctx.font = `bold ${bottomFontSize}px ${DEFAULT_FONT}`;
	ctx.fillText(shortURL, textCenterX, textCenterY + bottomFontSize / 2 + 10);

	return finalCanvas;
}

export async function createSlimQRCanvas(
	createCanvas,
	url,
	options = {}
) {
	const qrOptions = commonQROptions(options);

	const qrSize = 600;
	const topPadding = 40;
	const labelHeight = 200;
	const cornerRadius = 50;

	const totalWidth = qrSize;
	const totalHeight = topPadding + qrSize + labelHeight;

	const qrCanvas = createCanvas(qrSize, qrSize);
	await QRCode.toCanvas(qrCanvas, url, {
		...qrOptions,
		width: qrSize,
		margin: 0, // remove the QR's own quiet zone
	});

	const finalCanvas = createCanvas(totalWidth, totalHeight);
	const ctx = finalCanvas.getContext("2d");

	// White rounded card
	ctx.fillStyle = "white";
	roundedRectPath(ctx, 0, 0, totalWidth, totalHeight, cornerRadius);
	ctx.fill();

	// QR spans the full width
	ctx.drawImage(qrCanvas, 0, topPadding);

	// Divider
	const textStartY = topPadding + qrSize + 14;
	const shortURL = url.replace("https://hwidx.org", "");

	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.font = `bold 75px ${DEFAULT_FONT}`;

		// Domain
	ctx.fillText(
		"hwidx.org",
		(totalWidth / 2),
		textStartY + 45
	);

	ctx.fillText(
		"hwidx.org",
		(totalWidth / 2),
		textStartY + 45  
	);

	// Path
	ctx.fillText(
		shortURL,
		(totalWidth / 2),
		textStartY + 130
	);

	ctx.fillText(
		shortURL,
		(totalWidth / 2),
		textStartY + 130  
	);
	return finalCanvas;
}

export function createURLLabelCanvas(createCanvas, url, options = {}) {
	const shortURL = url.replace("https://", "");
	const padding = options.padding ?? 100;
	const height = options.height ?? 400;
	const cornerRadius = options.cornerRadius ?? 100;
	const fontSize = options.fontSize ?? 200;

	const tempCanvas = createCanvas(100, 100);
	const tempCtx = tempCanvas.getContext("2d");
	tempCtx.font = `bold ${fontSize}px ${DEFAULT_FONT}`;
	const textWidth = tempCtx.measureText(shortURL).width;

	const width = textWidth + padding * 2;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "black";
	roundedRectPath(ctx, 0, 0, width, height, cornerRadius);
	ctx.fill();

	ctx.fillStyle = "white";
	ctx.font = `bold ${fontSize}px ${DEFAULT_FONT}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(shortURL, width / 2, height / 2);

	return canvas;
}

export default {
	commonQROptions,
	renderQRCodeToCanvas,
	createLogoMarkCanvas,
	createLogoMarkHorizontalCanvas,
	createURLLabelCanvas,
	createSlimQRCanvas
};
