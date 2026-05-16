import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Maps a PDF font name (from pdf.js) to the closest pdf-lib StandardFont.
 * PDF font names follow patterns like:
 *   "g_d0_f1" (embedded), "BCDEEE+Calibri-Bold", "TimesNewRomanPSMT", 
 *   "ArialMT", "Arial-BoldMT", "Helvetica-Bold", etc.
 * 
 * We detect:
 *   1. Font family (serif vs sans-serif vs monospace)
 *   2. Weight (bold)
 *   3. Style (italic/oblique)
 */
function mapToStandardFont(fontName, overrides = {}) {
  if (!fontName) return { font: StandardFonts.Helvetica, isBold: false, isItalic: false };

  const name = fontName.toLowerCase();
  
  // Detect bold
  const isBold = overrides.bold || /bold|black|heavy|demi|semibold|negrita/i.test(fontName);
  
  // Detect italic/oblique
  const isItalic = overrides.italic || /italic|oblique|inclined|cursiva/i.test(fontName);
  
  // Detect font family
  const isSerif = /times|roman|garamond|georgia|cambria|palatino|book|serif/i.test(fontName) 
    && !/sans/i.test(fontName);
  const isMono = /courier|mono|consolas|menlo|code|terminal/i.test(fontName);
  
  let font;
  
  if (isMono) {
    if (isBold && isItalic) font = StandardFonts.CourierBoldOblique;
    else if (isBold) font = StandardFonts.CourierBold;
    else if (isItalic) font = StandardFonts.CourierOblique;
    else font = StandardFonts.Courier;
  } else if (isSerif) {
    if (isBold && isItalic) font = StandardFonts.TimesRomanBoldItalic;
    else if (isBold) font = StandardFonts.TimesRomanBold;
    else if (isItalic) font = StandardFonts.TimesRomanItalic;
    else font = StandardFonts.TimesRoman;
  } else {
    // Default: sans-serif (Helvetica family)
    if (isBold && isItalic) font = StandardFonts.HelveticaBoldOblique;
    else if (isBold) font = StandardFonts.HelveticaBold;
    else if (isItalic) font = StandardFonts.HelveticaOblique;
    else font = StandardFonts.Helvetica;
  }
  
  return { font, isBold, isItalic };
}

/**
 * Tries to extract and reuse the original embedded font from the PDF.
 * Falls back to the standard font mapping if extraction fails.
 */
async function getFont(pdfDoc, page, fontName, overrides = {}) {
  // ... (previous logic omitted for brevity as it's best-effort)
  
  // Map to the closest standard font
  const { font } = mapToStandardFont(fontName, overrides);
  return await pdfDoc.embedFont(font);
}

// Cache embedded fonts to avoid re-embedding the same font multiple times
const fontCache = new Map();

async function getOrEmbedFont(pdfDoc, page, fontName, overrides = {}) {
  const { font: fontEnum } = mapToStandardFont(fontName, overrides);
  const cacheKey = fontEnum;
  
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey);
  }
  
  const embeddedFont = await pdfDoc.embedFont(fontEnum);
  fontCache.set(cacheKey, embeddedFont);
  return embeddedFont;
}

export async function processPdfModifications(originalPdfBytes, modifications) {
  // Clear cache for each new document
  fontCache.clear();
  
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();
  
  for (const mod of modifications) {
    const page = pages[mod.pageIndex];
    if (page) {
      
      // Handle Text Edits and Annotations
      if (mod.newText !== undefined && mod.type !== 'image' && mod.type !== 'signature') {
        // Only draw white rectangle to hide old text if this is NOT a new annotation
        if (mod.oldText && mod.oldText.trim() !== '') {
          // Calculate wider coverage for bold text
          const { isBold } = mapToStandardFont(mod.fontName);
          const widthMultiplier = isBold ? 1.15 : 1.0; // Bold text is typically wider
          
          page.drawRectangle({
            x: mod.pdfX - 1,
            y: mod.pdfY - (mod.pdfFontSize * 0.3),
            width: (mod.pdfWidth * widthMultiplier) + 2,
            height: mod.pdfFontSize * 1.4,
            color: rgb(1, 1, 1),
          });
        }

        // Get any style overrides
        const overrides = {
          bold: mod.bold,
          italic: mod.italic
        };

        // Get the correct font for this text
        const font = await getOrEmbedFont(pdfDoc, page, mod.fontName, overrides);
        
        // Draw new text with the mapped font
        page.drawText(mod.newText, {
          x: mod.pdfX,
          y: mod.pdfY,
          size: mod.pdfFontSize,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Draw underline if requested
        if (mod.underline) {
          const textWidth = font.widthOfTextAtSize(mod.newText, mod.pdfFontSize);
          page.drawLine({
            start: { x: mod.pdfX, y: mod.pdfY - 1.5 },
            end: { x: mod.pdfX + textWidth, y: mod.pdfY - 1.5 },
            thickness: mod.pdfFontSize * 0.06,
            color: rgb(0, 0, 0),
          });
        }
      } 
      // Handle Images and Signatures as images
      else if (mod.type === 'image' || mod.type === 'signature') {
        try {
          if (!mod.dataUrl) return;
          const imageBytes = await fetch(mod.dataUrl).then(res => res.arrayBuffer());
          let image;
          if (mod.dataUrl.includes('image/png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            image = await pdfDoc.embedJpg(imageBytes);
          }
          
          const { width: imgWidth, height: imgHeight } = image.scale(1);
          const scale = Math.min(mod.width / imgWidth, mod.height / imgHeight);
          
          page.drawImage(image, {
            x: mod.x / 1.5,
            y: (page.getHeight() - (mod.y / 1.5) - (imgHeight * scale)),
            width: imgWidth * scale,
            height: imgHeight * scale,
          });
        } catch (e) {
          console.error("Failed to embed image/signature", e);
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
