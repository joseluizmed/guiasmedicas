import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { GenericFormData, PdfOutputAction, FieldMetadata } from '../types';
import { mapFormDataToTissFields } from './tissMapper';
import { loadData } from './localforage';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@^4.6.1/build/pdf.worker.mjs';


const DEFAULT_FONT_SIZE = 9;
const LINE_HEIGHT_RATIO = 1.2;

/**
 * Wraps text into multiple lines to fit a specified width. Handles existing newlines,
 * normal word wrapping, and will break words that are too long to fit on a single line.
 * @param text The text to wrap.
 * @param font The PDFFont instance.
 * @param maxWidth The maximum width of a line in points.
 * @param fontSize The font size.
 * @returns An array of strings, where each string is a line of wrapped text.
 */
function wrapText(text: string, font: PDFFont, maxWidth: number, fontSize: number): string[] {
    const lines: string[] = [];
    // Respect user-entered newlines by splitting the text into paragraphs first.
    const paragraphs = String(text || '').split('\n');

    for (const paragraph of paragraphs) {
        if (paragraph === '') {
            lines.push('');
            continue;
        }

        const words = paragraph.split(' ');
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            
            if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
                currentLine = testLine;
            } else {
                // The new word makes the line too long.
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                currentLine = word;

                // Handle the case where the word itself is longer than the max width.
                if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
                    let tempWord = word;
                    while (tempWord.length > 0) {
                        let breakPoint = tempWord.length;
                        // Find the last character that fits
                        while (font.widthOfTextAtSize(tempWord.substring(0, breakPoint), fontSize) > maxWidth && breakPoint > 1) {
                            breakPoint--;
                        }
                        const partThatFits = tempWord.substring(0, breakPoint);
                        lines.push(partThatFits);
                        tempWord = tempWord.substring(breakPoint);
                    }
                    currentLine = ''; // The oversized word has been fully processed.
                }
            }
        }

        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
    }

    return lines;
}


/**
 * Draws text within a specified bounding box, applying scaling factors to align coordinate systems.
 * Handles wrapping for multi-line fields and truncation with ellipsis for overflow.
 * This version correctly handles PDFs where the CropBox is offset from the MediaBox.
 */
async function drawTextInBox(
    pdfDoc: PDFDocument,
    text: string,
    field: FieldMetadata,
    scale: { scaleX: number; scaleY: number },
    cropBox: { x: number, y: number, width: number, height: number }
) {
    const page = pdfDoc.getPage(field.pageIndex);
    if (!page) {
        console.warn(`Página com índice ${field.pageIndex} não encontrada.`);
        return;
    }

    // The field coordinates from the editor are relative to the top-left of the cropped view.
    // We scale them to match the pdf-lib cropbox dimensions.
    const scaledFieldX = field.x * scale.scaleX;
    const scaledFieldY = field.y * scale.scaleY;
    const scaledWidth = field.width * scale.scaleX;
    const scaledHeight = field.height * scale.scaleY;

    const align = field.align || 'left';
    const fontSize = field.fontSize || DEFAULT_FONT_SIZE;
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Heuristic: A field is considered multiline if explicitly flagged, or if its height is significantly
    // larger than a typical single line of text (e.g., > 30 points).
    // This correctly handles mappings that omit the multiline flag for large text areas and prevents
    // tall single-line fields from being misidentified.
    const isMultiline = field.multiline === true || scaledHeight > 30;
    
    let lines: string[];

    if (isMultiline) {
        const lineHeight = fontSize * LINE_HEIGHT_RATIO;
        lines = wrapText(text, font, scaledWidth, fontSize);
        const maxLines = Math.floor(scaledHeight / lineHeight);
        if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            if (lines.length > 0) {
               let lastLine = lines[lines.length - 1];
               while (font.widthOfTextAtSize(lastLine + '...', fontSize) > scaledWidth && lastLine.length > 0) {
                   lastLine = lastLine.slice(0, -1);
               }
               lines[lines.length - 1] = lastLine + '...';
            }
        }
    } else {
        const singleLineText = String(text || '').replace(/\n/g, ' ');
        if (font.widthOfTextAtSize(singleLineText, fontSize) > scaledWidth) {
            let truncatedText = singleLineText;
            while (font.widthOfTextAtSize(truncatedText + '...', fontSize) > scaledWidth && truncatedText.length > 0) {
                truncatedText = truncatedText.slice(0, -1);
            }
            lines = [truncatedText + '...'];
        } else {
            lines = [singleLineText];
        }
    }
    
    // The drawing coordinates need to be transformed from "top-left of cropbox" (editor)
    // to "bottom-left of mediabox" (pdf-lib's native coordinate system).
    
    const cropTopY = cropBox.y + cropBox.height;
    
    // The top of our text box, in pdf-lib coordinates, is the top of the cropbox minus the scaled y-offset from the editor.
    const boxTopY_in_mediabox_coords = cropTopY - scaledFieldY;
    const boxBottomY_in_mediabox_coords = boxTopY_in_mediabox_coords - scaledHeight;
    
    // The X coordinate is the left edge of the cropbox plus the scaled x-offset from the editor.
    const boxLeftX_in_mediabox_coords = cropBox.x + scaledFieldX;

    if (isMultiline) {
        // For top-alignment, calculate the baseline of the first line from the top of the box.
        // We use the font's ascent to position the text precisely at the top.
        const lineHeight = fontSize * LINE_HEIGHT_RATIO;
        const ascent = font.heightAtSize(fontSize, { descender: false });
        const firstLineBaselineY = boxTopY_in_mediabox_coords - ascent;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const textWidth = font.widthOfTextAtSize(line, fontSize);
            let startX = boxLeftX_in_mediabox_coords;

            if (align === 'center') {
                startX = boxLeftX_in_mediabox_coords + (scaledWidth - textWidth) / 2;
            } else if (align === 'right') {
                startX = boxLeftX_in_mediabox_coords + scaledWidth - textWidth;
            }

            const currentLineY = firstLineBaselineY - (i * lineHeight);

            page.drawText(line, {
                x: startX,
                y: currentLineY,
                font,
                size: fontSize,
                color: rgb(0, 0, 0),
            });
        }
    } else {
        // For single-line fields, align the text to the bottom.
        const line = lines[0] || '';
        const textWidth = font.widthOfTextAtSize(line, fontSize);
        let startX = boxLeftX_in_mediabox_coords;

        if (align === 'center') {
            startX = boxLeftX_in_mediabox_coords + (scaledWidth - textWidth) / 2;
        } else if (align === 'right') {
            startX = boxLeftX_in_mediabox_coords + scaledWidth - textWidth;
        }
        
        // To align to the bottom, we position the text's baseline relative to the bottom of the box.
        // The descent is the distance from the baseline to the bottom of the glyphs.
        const fullHeight = font.heightAtSize(fontSize);
        const ascent = font.heightAtSize(fontSize, { descender: false });
        const descent = fullHeight - ascent;
        
        // The baseline is positioned at the bottom of the box plus the font's descent,
        // making the text appear to "sit" on the bottom line of the field.
        const baselineY = boxBottomY_in_mediabox_coords + descent;

        page.drawText(line, {
            x: startX,
            y: baselineY,
            font,
            size: fontSize,
            color: rgb(0, 0, 0),
        });
    }
}


/**
 * Fetches metadata, calculates coordinate scaling based on the PDF's CropBox,
 * maps form data, and draws it on the PDF.
 */
const drawDataOnPdf = async (pdfDoc: PDFDocument, formData: GenericFormData, plan: string, templateBytes: ArrayBuffer) => {
    const mappingStorageKey = `custom_mapping_${plan.toLowerCase()}`;
    let metadata: FieldMetadata[];

    const customMapping = await loadData<FieldMetadata[]>(mappingStorageKey);

    if (customMapping && customMapping.length > 0) {
        metadata = customMapping;
    } else {
        const metadataUrl = `/assets/data/mappings/${plan.toLowerCase()}.json`;
        try {
            const metadataResponse = await fetch(metadataUrl, { cache: 'no-store' });
            if (!metadataResponse.ok) {
                throw new Error(`Status: ${metadataResponse.status}`);
            }
            metadata = await metadataResponse.json();
        } catch (e) {
            console.error(`Falha ao carregar o arquivo de metadados de ${metadataUrl}`, e);
            throw new Error(`Não foi possível carregar o arquivo de mapeamento para o plano "${plan}" em "${metadataUrl}". Verifique se o arquivo existe e está nomeado corretamente (ex: 'unimed.json').`);
        }
    }

    // --- Coordinate Unification ---
    // The rendering in the editor (pdf.js) is based on the CropBox.
    // PDF writing (pdf-lib) is based on the MediaBox, but we must align with the CropBox.
    const pdfLibPage = pdfDoc.getPage(0);
    const pdfLibCropBox = pdfLibPage.getCropBox();
    
    let scaleX = 1;
    let scaleY = 1;
    let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;
    try {
        // Use slice(0) to pass a copy of the buffer, preventing issues
        pdfjsDoc = await pdfjsLib.getDocument({ data: templateBytes.slice(0) }).promise;
        const pdfjsPage = await pdfjsDoc.getPage(1); // pdf.js page index is 1-based
        // The pdf.js viewport corresponds to the CropBox dimensions.
        const viewport = pdfjsPage.getViewport({ scale: 1.0 });
        const { width: pdfjsWidth, height: pdfjsHeight } = viewport;
        
        // Avoid division by zero and calculate scale based on CropBox dimensions.
        if (pdfjsWidth > 0 && pdfjsHeight > 0) {
            scaleX = pdfLibCropBox.width / pdfjsWidth;
            scaleY = pdfLibCropBox.height / pdfjsHeight;
        }
    } catch(err) {
        console.error("Erro ao carregar PDF com pdf.js para calcular escala. Usando escala 1.0.", err);
    } finally {
        // Ensure the pdf.js document is destroyed to free up memory.
        pdfjsDoc?.destroy();
    }
    // --- End of Unification ---

    const mappedData = mapFormDataToTissFields(formData);

    for (const field of metadata) {
        const value = mappedData[field.fieldNumber];
        if (value === undefined || value === null || String(value).trim() === '') {
            continue;
        }
        await drawTextInBox(pdfDoc, String(value), field, { scaleX, scaleY }, pdfLibCropBox);
    }
}


/**
 * Loads a PDF template, fills it by drawing text based on metadata, and provides it to the user.
 */
export const generatePdfWithTemplate = async (
    plan: string,
    formData: GenericFormData,
    filename: string,
    outputAction: PdfOutputAction
): Promise<void> => {
    const templateUrl = `/assets/templates/${plan.toLowerCase()}.pdf`;
    let templateBytes;
    try {
        const response = await fetch(templateUrl);
        if (!response.ok) {
            throw new Error(`O template para "${plan}" não foi encontrado (status: ${response.status})`);
        }
        templateBytes = await response.arrayBuffer();
    } catch (e) {
        console.error(`Falha ao carregar o template PDF de ${templateUrl}`, e);
        throw new Error(`Não foi possível carregar o template PDF para o plano "${plan}". Verifique se o arquivo existe em "public/assets/templates/".`);
    }

    const pdfDoc = await PDFDocument.load(templateBytes);
    
    try {
        const form = pdfDoc.getForm();
        if (form.getFields().length > 0) {
            form.flatten();
        }
    } catch (err) {
        console.warn("Could not flatten form, proceeding without it.", err);
    }
    
    await drawDataOnPdf(pdfDoc, formData, plan, templateBytes);
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    switch (outputAction) {
        case 'print':
            const pdfWindow = window.open(url);
            if (pdfWindow) {
                pdfWindow.onload = () => {
                    setTimeout(() => {
                        try {
                            pdfWindow.focus();
                            pdfWindow.print();
                        } catch (error) {
                            console.error("Falha ao iniciar a impressão:", error);
                        }
                    }, 250);
                };
            } else {
                alert("A abertura de novas janelas (pop-up) foi bloqueada. Por favor, habilite pop-ups para este site para usar a função de imprimir.");
            }
            break;

        case 'view':
            window.open(url, '_blank');
            break;

        case 'download':
        default:
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
            break;
    }
};