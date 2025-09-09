



import { GenericFormData, Mapping, PdfOutputAction } from '../types';
import {
  generateAmilPdf,
  generateBradescoPdf,
  generateGeapPdf,
  generateHumanaPdf,
  generatePetrobrasPdf,
  generateSaudeCaixaPdf,
  generateSulAmericaPdf,
  generateUnimedPdf,
} from './pdfGenerators';

const sanitizeFilename = (str: string) => {
    // Substitui espaços por underscores e remove quaisquer caracteres que não sejam alfanuméricos, underscores ou hífens.
    return (str || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
};

export const generatePdfForPlan = (
    plan: string, 
    formData: GenericFormData, 
    backgroundImages: { [key: string]: string },
    mappings: { [key: string]: Mapping },
    outputAction: PdfOutputAction = 'download'
): void => {
  const backgroundImage = backgroundImages[plan] || '';
  const mapping = mappings[plan] || [];

  if (!backgroundImage) {
      alert(`A imagem de fundo para o plano ${plan} não foi carregada.`);
      return;
  }
   if (mapping.length === 0) {
      alert(`O mapeamento de PDF para o plano ${plan} não foi encontrado ou está vazio. O PDF será gerado apenas com a imagem de fundo.`);
  }
  
  const planName = plan;
  const patientName = sanitizeFilename(formData.nomeBeneficiario || 'Paciente');
  const requesterName = sanitizeFilename(formData.nomeProfissionalSolicitante || 'Solicitante');
  const emissionDate = (formData.dataSolicitacao || new Date().toISOString().split('T')[0]);

  const filename = `Guia_${planName}_${patientName}_${requesterName}_${emissionDate}.pdf`;


  const generators: { [key: string]: (formData: GenericFormData, backgroundImage: string, mapping: Mapping, filename: string, outputAction: PdfOutputAction) => Promise<void> } = {
    Amil: generateAmilPdf,
    Bradesco: generateBradescoPdf,
    Unimed: generateUnimedPdf,
    Humana: generateHumanaPdf,
    Petrobras: generatePetrobrasPdf,
    saudecaixa: generateSaudeCaixaPdf,
    SulAmerica: generateSulAmericaPdf,
    Geap: generateGeapPdf,
  };

  const generator = generators[plan];

  if (generator) {
      generator(formData, backgroundImage, mapping, filename, outputAction);
  } else {
      alert(`A geração de PDF para o plano ${plan} ainda não foi implementada.`);
  }
};
