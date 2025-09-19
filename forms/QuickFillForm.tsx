import React, { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GenericFormData, SolicitanteData, PrestadorData, QuickFillProcedureData, PdfOutputAction } from '../types';
import { solicitanteSearchFilter, prestadorSearchFilter, quickFillProcedureSearchFilter } from '../utils/searchUtils';
import Section from '../components/Section';
import TextInput from '../components/form/TextInput';
import AutocompleteInput from '../components/form/AutocompleteInput';
import { generatePdfForPlan } from '../utils/pdfService';

interface QuickFillFormProps {
  formData: GenericFormData;
  setFormData: React.Dispatch<React.SetStateAction<GenericFormData>>;
  solicitantesData: SolicitanteData[];
  prestadoresData: PrestadorData[];
  quickFillProcedures: QuickFillProcedureData[];
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onFillModeChange: (mode: 'detailed' | 'quick') => void;
  onGenerateAndSavePdf: (outputAction: PdfOutputAction) => void;
  onSaveFavorite: () => void;
  selectedPlan: string;
}

const QuickFillForm: React.FC<QuickFillFormProps> = ({ formData, setFormData, solicitantesData, prestadoresData, quickFillProcedures, setToast, onFillModeChange, onGenerateAndSavePdf, onSaveFavorite, selectedPlan }) => {
  const formRef = useRef<HTMLFormElement>(null);

  const validateAndScroll = useCallback((): boolean => {
    const form = formRef.current;
    if (form && !form.checkValidity()) {
        const firstInvalidField = form.querySelector(':invalid') as HTMLInputElement;
        if (firstInvalidField) {
            const label = firstInvalidField.labels?.[0]?.innerText || firstInvalidField.getAttribute('aria-label') || 'um campo obrigatório';
            const cleanLabel = label.replace('*', '').trim();
            setToast({ message: `Por favor, preencha o campo: ${cleanLabel}.`, type: 'error' });

            const header = document.getElementById('app-header');
            const headerHeight = header ? header.offsetHeight : 0;
            
            const elementRect = firstInvalidField.getBoundingClientRect();
            const desiredTop = headerHeight + (window.innerHeight - headerHeight) / 2 - (elementRect.height / 2);
            const scrollAmount = elementRect.top - desiredTop;

            window.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });

            firstInvalidField.style.transition = 'outline .2s ease-in-out';
            firstInvalidField.style.outline = '3px solid #F2A900';
            setTimeout(() => {
                firstInvalidField.style.outline = '';
            }, 3000);

            firstInvalidField.focus({ preventScroll: true });
        } else {
            setToast({ message: 'Por favor, preencha todos os campos obrigatórios.', type: 'error' });
        }
        return false;
    }
    return true;
  }, [setToast]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumberInput = type === 'number';
    setFormData(prev => ({
      ...prev,
      [name]: isNumberInput ? parseFloat(value) || 0 : value,
    }));
  }, [setFormData]);

  const handleQuickFillSelect = (item: QuickFillProcedureData) => {
    setFormData(prev => ({
      ...prev,
      ...item,
      quickFillProcedure: item.nomeComum,
      nomeBeneficiario: prev.nomeBeneficiario,
      nomeProfissionalSolicitante: prev.nomeProfissionalSolicitante,
      conselhoProfissional: prev.conselhoProfissional,
      numeroConselho: prev.numeroConselho,
      ufConselho: prev.ufConselho,
      nomePrestador: prev.nomePrestador,
      nomeHospitalSolicitado: prev.nomeHospitalSolicitado,
      procedimentos: item.procedimentos.map(p => ({ ...p, id: uuidv4() })),
      diagnosticos: item.diagnosticos.map(d => ({ ...d, id: uuidv4() })),
      opm: item.opm ? item.opm.map(o => ({ ...o, id: uuidv4() })) : [],
    }));
  };

  const handleGeneratePdf = (outputAction: PdfOutputAction) => {
    if (!validateAndScroll()) return;
    onGenerateAndSavePdf(outputAction);
  };
  
  const handlePrint = () => {
    if (!validateAndScroll()) return;
    onGenerateAndSavePdf('print');
  };

  const solicitanteDisplayFn = (item: SolicitanteData) => item.nomeProfissionalSolicitante;
  const prestadorDisplayFn = (item: PrestadorData) => item.nome;
  const quickFillDisplayFn = (item: QuickFillProcedureData) => item.nomeComum;

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-8">
      <Section title="Preenchimento Rápido">
        <TextInput label="Nome do Paciente" name="nomeBeneficiario" value={formData.nomeBeneficiario} onChange={handleChange} required className="col-span-full" />
        
        <AutocompleteInput<SolicitanteData>
          label="Nome do Solicitante"
          name="nomeProfissionalSolicitante"
          value={formData.nomeProfissionalSolicitante}
          onChange={handleChange}
          onSelect={(item) => setFormData(prev => ({
              ...prev,
              nomeProfissionalSolicitante: item.nomeProfissionalSolicitante,
              conselhoProfissional: item.conselhoProfissional,
              numeroConselho: item.numeroConselho,
              ufConselho: item.ufConselho,
          }))}
          data={solicitantesData}
          filterFn={solicitanteSearchFilter}
          displayFn={solicitanteDisplayFn}
          required
          className="col-span-full"
        />
        
        <AutocompleteInput<PrestadorData>
            label="Nome do Prestador"
            name="nomePrestador"
            value={formData.nomePrestador}
            onChange={handleChange}
            onSelect={(item) => setFormData(prev => ({ ...prev, nomePrestador: item.nome, nomeHospitalSolicitado: item.nome }))}
            data={prestadoresData}
            filterFn={prestadorSearchFilter}
            displayFn={prestadorDisplayFn}
            required
            className="col-span-full"
        />

        <AutocompleteInput<QuickFillProcedureData>
            label="Procedimento e campos pré-configurados"
            name="quickFillProcedure"
            value={formData.quickFillProcedure}
            onChange={(e) => setFormData(prev => ({ ...prev, quickFillProcedure: e.target.value }))}
            onSelect={handleQuickFillSelect}
            data={quickFillProcedures}
            filterFn={quickFillProcedureSearchFilter}
            displayFn={quickFillDisplayFn}
            required
            className="col-span-full"
        />
         <div className="col-span-full pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={() => onFillModeChange('detailed')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-light border-2 border-dashed border-secondary text-secondary rounded-lg font-semibold hover:bg-blue-100 hover:border-solid transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>Precisa de mais detalhes? Clique para mudar para o Preenchimento Detalhado.</span>
            </button>
        </div>
      </Section>

      <div className="mt-8 p-4 bg-white shadow-md rounded-lg">
        <div className="flex justify-end items-center gap-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => handleGeneratePdf('view')} title="Ver Guia" className="p-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.27 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
            </button>
            <button type="button" onClick={() => handleGeneratePdf('download')} title="Salvar PDF" className="p-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button type="button" onClick={handlePrint} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
              Imprimir Guia
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default QuickFillForm;