import { GenericFormData, PdfOutputAction } from '../types';
import { generatePdfWithTemplate } from './pdfGenerators';

const sanitizeFilename = (str: string) => {
    return (str || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
};

export const generatePdfForPlan = (
    plan: string, 
    formData: GenericFormData, 
    outputAction: PdfOutputAction = 'download'
): void => {
  // Os parâmetros backgroundImages e mappings são ignorados na nova implementação,
  // mas a assinatura da função pode ser mantida em App.tsx para minimizar alterações lá.
  
  const patientName = sanitizeFilename(formData.nomeBeneficiario || 'Paciente');
  const emissionDate = (formData.dataSolicitacao || new Date().toISOString().split('T')[0]);
  const filename = `Guia_${plan}_${patientName}_${emissionDate}.pdf`;

  // Todos os planos agora usam o mesmo gerador baseado em template.
  // O template específico é escolhido dentro de `generatePdfWithTemplate` com base no nome do plano.
  generatePdfWithTemplate(plan, formData, filename, outputAction)
    .catch(error => {
        console.error("Falha ao gerar PDF:", error);
        alert(error.message || 'Ocorreu um erro desconhecido ao gerar o PDF.');
    });
};
