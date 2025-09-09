
import jsPDF from 'jspdf';
import { GenericFormData, Mapping } from '../types';

const getValue = (obj: any, path: string): any => {
    return path.split('.').reduce((o, key) => (o && o[key] !== 'undefined' ? o[key] : ''), obj);
};

const drawCharField = (doc: jsPDF, text: string, x: number, y: number, charWidth: number, boxWidth: number, limit: number, fontStyle: 'normal' | 'bold' = 'normal') => {
    if (fontStyle === 'bold') doc.setFont('helvetica', 'bold');
    const chars = String(text || '').slice(0, limit).split('');
    chars.forEach((char, index) => {
        doc.text(char, x + (index * charWidth) + (boxWidth / 2), y, { align: 'center' });
    });
    if (fontStyle === 'bold') doc.setFont('helvetica', 'normal');
};

const generatePdfFromMapping = async (doc: jsPDF, formData: GenericFormData, mapping: Mapping) => {
    // Use a for...of loop to handle async operations correctly (e.g., image loading).
    for (const item of mapping) {
        doc.setFont(item.fontName || 'helvetica', item.fontStyle || 'normal');
        doc.setFontSize(item.fontSize || 8);

        if (item.isList) {
            const listData = getValue(formData, item.key as string) as any[];
            if (listData && Array.isArray(listData)) {
                let currentY = item.startY || item.y;
                const maxRows = item.maxRows || listData.length;

                listData.slice(0, maxRows).forEach(listItem => {
                    item.columns?.forEach(column => {
                        let value = getValue(listItem, column.key);

                        if (item.key === 'opm' && column.key === 'quantidade' && value === 0) {
                            value = '';
                        }

                        if (column.isCharField) {
                            drawCharField(doc, value, column.x, currentY - 0.5, column.charWidth || 4, column.boxWidth || 3, column.limit || 10);
                        } else if (column.width) {
                            const lines = doc.splitTextToSize(String(value || ''), column.width);
                            doc.text(lines, column.x, currentY, { align: column.align || 'left' });
                        } else {
                            doc.text(String(value || ''), column.x, currentY, { align: column.align || 'left' });
                        }
                    });
                    currentY += item.rowHeight || 5;
                });
            }
        } else if (item.isConditional) {
            const value = getValue(formData, item.key as string);
            if (value === item.conditionValue) {
                doc.text(item.text || 'X', item.x, item.y);
            }
        } else if (item.options) {
             const value = getValue(formData, item.key as string);
             if (value && item.options[value]) {
                 const coords = item.options[value];
                 doc.text('X', coords.x, coords.y);
             }
        } else {
            let value = getValue(formData, item.key as string);

             if (item.key === 'qtdeDiariasSolicitadas' && value === 0) {
                value = 'Day Clinic';
             }

             if (item.isDate && value) {
                 value = new Date(value + 'T00:00:00').toLocaleDateString('pt-BR');
             }

            if (item.isCharField) {
                const cleanValue = String(value || '').replace(/-/g, '');
                drawCharField(doc, cleanValue, item.x, item.y, item.charWidth || 4, item.boxWidth || 3, item.limit || 10, item.fontStyle as 'bold' | 'normal');
            } else if (item.key === 'assinaturaMedicoImage' && value) {
                 try {
                    const imageType = value.substring("data:image/".length, value.indexOf(";base64")).toUpperCase();
                    if (['PNG', 'JPEG', 'JPG'].includes(imageType)) {
                        
                        const img = new Image();
                        img.src = value;
                        await new Promise(resolve => { img.onload = resolve; });
                        
                        const originalWidth = img.width;
                        const originalHeight = img.height;
                        const aspectRatio = originalWidth / originalHeight;

                        const maxWidth = item.width || 40;
                        const maxHeight = item.height || 15;

                        let newWidth = maxWidth;
                        let newHeight = newWidth / aspectRatio;

                        if (newHeight > maxHeight) {
                            newHeight = maxHeight;
                            newWidth = newHeight * aspectRatio;
                        }

                        const xPos = item.x + (maxWidth - newWidth) / 2;
                        const yPos = item.y + (maxHeight - newHeight) / 2;

                        doc.addImage(value, imageType, xPos, yPos, newWidth, newHeight);
                    }
                 } catch (e) { console.error("Error adding signature image to PDF:", e); }
            }
            else if (item.width) {
                const lines = doc.splitTextToSize(String(value || ''), item.width);
                doc.text(lines, item.x, item.y, { align: item.align || 'left' });
            } else {
                doc.text(String(value || ''), item.x, item.y, { align: item.align || 'left' });
            }
        }
    }
};

type PdfOutputAction = 'view' | 'print' | 'download';

const createPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (backgroundImage) {
    doc.addImage(backgroundImage, 'PNG', 0, 0, pageWidth, pageHeight);
  }
  
  await generatePdfFromMapping(doc, formData, mapping);

  switch (outputAction) {
    case 'view':
      window.open(doc.output('bloburl'), '_blank');
      break;
    case 'print':
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
      break;
    case 'download':
    default:
      doc.save(filename);
      break;
  }
};

export const generateAmilPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
};

export const generateBradescoPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
};

export const generateHumanaPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
};

export const generatePetrobrasPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
}
export const generateSaudeCaixaPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
}
export const generateSulAmericaPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
}
export const generateGeapPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
}
export const generateUnimedPdf = async (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction): Promise<void> => {
  await createPdf(formData, backgroundImage, mapping, filename, outputAction);
}