function commonQROptions( options = {} ) {
    return {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        margin: 1,
        width: 600,
        height: 600,
        ...options
    };
}

function generateQRCode(path, url, options = {}) {
    const QRCode = require('qrcode');
    const qrOptions = commonQROptions( options );
    QRCode.toFile( path, url, qrOptions );
}

function generateLogoMark(path, url, options = {}) {
    const fs = require("fs");
    const { createCanvas, registerFont } = require('canvas');

    registerFont('src/assets/fonts/FredokaOne-Regular.ttf', { family: 'Fredoka One', weight: 'bold' });

    const QRCode = require("qrcode");
    const qrOptions = commonQROptions(options);
    
    const qrSize = 600;
    const borderWidth = 30;
    const textBarHeight = 100;
    const fontHeight = 90;
    const totalWidth = qrSize + (borderWidth * 2);
    const totalHeight = qrSize + (borderWidth * 2) + (textBarHeight * 2);
    const cornerRadius = fontHeight/2;
    
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Fill background black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // Generate QR code
    QRCode.toCanvas(canvas, url, {
        ...qrOptions,
        width: qrSize
    }, (error) => {
        if (error) throw error;
        
        // Create final canvas with borders and text bars
        const finalCanvas = createCanvas(totalWidth, totalHeight);
        const finalCtx = finalCanvas.getContext('2d');
        
        // Black background with rounded corners
        finalCtx.fillStyle = 'black';
        finalCtx.beginPath();
        finalCtx.moveTo(cornerRadius, 0);
        finalCtx.lineTo(totalWidth - cornerRadius, 0);
        finalCtx.quadraticCurveTo(totalWidth, 0, totalWidth, cornerRadius);
        finalCtx.lineTo(totalWidth, totalHeight - cornerRadius);
        finalCtx.quadraticCurveTo(totalWidth, totalHeight, totalWidth - cornerRadius, totalHeight);
        finalCtx.lineTo(cornerRadius, totalHeight);
        finalCtx.quadraticCurveTo(0, totalHeight, 0, totalHeight - cornerRadius);
        finalCtx.lineTo(0, cornerRadius);
        finalCtx.quadraticCurveTo(0, 0, cornerRadius, 0);
        finalCtx.closePath();
        finalCtx.fill();
        
        // Create clipping path for QR code with rounded inner corners
        const qrX = borderWidth;
        const qrY = borderWidth + textBarHeight;
        const qrCornerRadius = cornerRadius - borderWidth;
        
        finalCtx.save();
        finalCtx.beginPath();
        finalCtx.moveTo(qrX + qrCornerRadius, qrY);
        finalCtx.lineTo(qrX + qrSize - qrCornerRadius, qrY);
        finalCtx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + qrCornerRadius);
        finalCtx.lineTo(qrX + qrSize, qrY + qrSize - qrCornerRadius);
        finalCtx.quadraticCurveTo(qrX + qrSize, qrY + qrSize, qrX + qrSize - qrCornerRadius, qrY + qrSize);
        finalCtx.lineTo(qrX + qrCornerRadius, qrY + qrSize);
        finalCtx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - qrCornerRadius);
        finalCtx.lineTo(qrX, qrY + qrCornerRadius);
        finalCtx.quadraticCurveTo(qrX, qrY, qrX + qrCornerRadius, qrY);
        finalCtx.closePath();
        finalCtx.clip();
        
        // Draw QR code in center
        finalCtx.drawImage(canvas, borderWidth, borderWidth + textBarHeight);
        finalCtx.restore();
        
        // Add text
        finalCtx.fillStyle = 'white';
        finalCtx.font = `bold ${fontHeight}px "Fredoka One"`;
        finalCtx.textAlign = 'center';
        finalCtx.textBaseline = 'middle';
        
        // Top text
        finalCtx.fillText('hwidx.org', totalWidth / 2, (textBarHeight / 2) + (fontHeight/7));
        
        const shortURL = url.replace('https://hwidx.org', '');

        // Bottom text
        finalCtx.fillText(shortURL, totalWidth / 2, totalHeight - (textBarHeight / 2) - (fontHeight/7));
        
        const out = fs.createWriteStream(path);
        const stream = finalCanvas.createPNGStream();
        stream.pipe(out);
    });
}

function generateLogoMarkHorizontal(path, url, options = {}, invert = false) {
    const fs = require("fs");
    const { createCanvas } = require("canvas");
    const QRCode = require("qrcode");
    const qrOptions = commonQROptions(options);

    const qrSize = 800;
    const borderWidth = 50;
    const cornerRadius = 100;
    const fontHeight = (qrSize * 0.5)/2;
    const textPadding = 100;
    const shortURL = url.replace("https://hwidx.org", "");
    
    // Create temporary canvas to measure text
    const tempCanvas = createCanvas(100, 100);
    const tempCtx = tempCanvas.getContext("2d");
    
    // Measure both texts at their target font sizes
    tempCtx.font = `bold ${fontHeight}px "Fredoka One"`;
    const topTextWidth = tempCtx.measureText("hwidx.org").width;
    const bottomTextWidth = tempCtx.measureText(shortURL).width;
    
    // Use the larger width plus padding, with minimum of top text width
    const textBoxWidth = Math.max(topTextWidth, bottomTextWidth) + textPadding;
    
    const totalWidth = textBoxWidth + qrSize + borderWidth * 3;
    const totalHeight = qrSize + borderWidth * 2;

    const canvas = createCanvas(qrSize, qrSize);
    const ctx = canvas.getContext("2d");

    // Generate QR code
    QRCode.toCanvas(
        canvas,
        url,
        {
            ...qrOptions,
            width: qrSize,
        },
        (error) => {
            if (error) throw error;

            // Create final canvas
            const finalCanvas = createCanvas(totalWidth, totalHeight);
            const finalCtx = finalCanvas.getContext("2d");

            // Black background with rounded corners
            finalCtx.fillStyle = "black";
            finalCtx.beginPath();
            finalCtx.moveTo(cornerRadius, 0);
            finalCtx.lineTo(totalWidth - cornerRadius, 0);
            finalCtx.quadraticCurveTo(totalWidth, 0, totalWidth, cornerRadius);
            finalCtx.lineTo(totalWidth, totalHeight - cornerRadius);
            finalCtx.quadraticCurveTo(
                totalWidth,
                totalHeight,
                totalWidth - cornerRadius,
                totalHeight
            );
            finalCtx.lineTo(cornerRadius, totalHeight);
            finalCtx.quadraticCurveTo(0, totalHeight, 0, totalHeight - cornerRadius);
            finalCtx.lineTo(0, cornerRadius);
            finalCtx.quadraticCurveTo(0, 0, cornerRadius, 0);
            finalCtx.closePath();
            finalCtx.fill();

            // White box on the left
            const whiteBoxX = borderWidth;
            const whiteBoxY = borderWidth;
            const whiteBoxCornerRadius = cornerRadius - borderWidth;
            
            finalCtx.fillStyle = "white";

            if( invert )
                finalCtx.fillStyle = "black";

            finalCtx.beginPath();
            finalCtx.moveTo(whiteBoxX + whiteBoxCornerRadius, whiteBoxY);
            finalCtx.lineTo(whiteBoxX + textBoxWidth - whiteBoxCornerRadius, whiteBoxY);
            finalCtx.quadraticCurveTo(whiteBoxX + textBoxWidth, whiteBoxY, whiteBoxX + textBoxWidth, whiteBoxY + whiteBoxCornerRadius);
            finalCtx.lineTo(whiteBoxX + textBoxWidth, whiteBoxY + qrSize - whiteBoxCornerRadius);
            finalCtx.quadraticCurveTo(whiteBoxX + textBoxWidth, whiteBoxY + qrSize, whiteBoxX + textBoxWidth - whiteBoxCornerRadius, whiteBoxY + qrSize);
            finalCtx.lineTo(whiteBoxX + whiteBoxCornerRadius, whiteBoxY + qrSize);
            finalCtx.quadraticCurveTo(whiteBoxX, whiteBoxY + qrSize, whiteBoxX, whiteBoxY + qrSize - whiteBoxCornerRadius);
            finalCtx.lineTo(whiteBoxX, whiteBoxY + whiteBoxCornerRadius);
            finalCtx.quadraticCurveTo(whiteBoxX, whiteBoxY, whiteBoxX + whiteBoxCornerRadius, whiteBoxY);
            finalCtx.closePath();
            finalCtx.fill();

            // Create clipping path for QR code with rounded corners
            const qrX = borderWidth * 2 + textBoxWidth;
            const qrY = borderWidth;
            const qrCornerRadius = cornerRadius - borderWidth;

            finalCtx.save();
            finalCtx.beginPath();
            finalCtx.moveTo(qrX + qrCornerRadius, qrY);
            finalCtx.lineTo(qrX + qrSize - qrCornerRadius, qrY);
            finalCtx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + qrCornerRadius);
            finalCtx.lineTo(qrX + qrSize, qrY + qrSize - qrCornerRadius);
            finalCtx.quadraticCurveTo(qrX + qrSize, qrY + qrSize, qrX + qrSize - qrCornerRadius, qrY + qrSize);
            finalCtx.lineTo(qrX + qrCornerRadius, qrY + qrSize);
            finalCtx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - qrCornerRadius);
            finalCtx.lineTo(qrX, qrY + qrCornerRadius);
            finalCtx.quadraticCurveTo(qrX, qrY, qrX + qrCornerRadius, qrY);
            finalCtx.closePath();
            finalCtx.clip();

            // Draw QR code on the right
            finalCtx.drawImage(canvas, qrX, qrY);
            finalCtx.restore();

            // Add black text on white background with dynamic sizing
            finalCtx.fillStyle = "black";
            finalCtx.textAlign = "center";
            finalCtx.textBaseline = "middle";

            if( invert )
                finalCtx.fillStyle = "white";

            const textCenterX = borderWidth + textBoxWidth / 2;
            const textCenterY = totalHeight / 2;
            const maxTextWidth = textBoxWidth - textPadding;

            // Find optimal font size for "hwidx.org"
            let topFontSize = fontHeight;
            finalCtx.font = `bold ${topFontSize}px "Fredoka One"`;
            while (finalCtx.measureText("hwidx.org").width > maxTextWidth && topFontSize > 10) {
                topFontSize--;
                finalCtx.font = `bold ${topFontSize}px "Fredoka One"`;
            }
            finalCtx.fillText("hwidx.org", textCenterX, textCenterY - topFontSize / 2 - 10);

            // Find optimal font size for shortURL
            let bottomFontSize = fontHeight;
            finalCtx.font = `bold ${bottomFontSize}px "Fredoka One"`;
            while (finalCtx.measureText(shortURL).width > maxTextWidth && bottomFontSize > 10) {
                bottomFontSize--;
                finalCtx.font = `bold ${bottomFontSize}px "Fredoka One"`;
            }
            finalCtx.fillText(shortURL, textCenterX, textCenterY + bottomFontSize / 2 + 10);

            const out = fs.createWriteStream(path);
            const stream = finalCanvas.createPNGStream();
            stream.pipe(out);
        }
    );
}

function generateURLLabel(path, url) {
    const fs = require("fs");
    const { createCanvas } = require('canvas');
    
    const shortURL = url.replace('https://', '');
    const padding = 100;
    const height = 400;
    const cornerRadius = 100;
    
    // Create temporary canvas to measure text
    const tempCanvas = createCanvas(100, 100);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = 'bold 200px "Fredoka One"';
    const textWidth = tempCtx.measureText(shortURL).width;
    
    const width = textWidth + (padding * 2);
    
    // Create final canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Black background with rounded corners
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(width - cornerRadius, 0);
    ctx.quadraticCurveTo(width, 0, width, cornerRadius);
    ctx.lineTo(width, height - cornerRadius);
    ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
    ctx.lineTo(cornerRadius, height);
    ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.fill();
    
    // White text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 200px "Fredoka One"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shortURL, width / 2, height / 2);
    
    const out = fs.createWriteStream(path);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
}

module.exports = {
    qrCode: generateQRCode,
    logoMark: generateLogoMark,
    logoMarkHorizontal: generateLogoMarkHorizontal,
    labelMark: generateURLLabel
};