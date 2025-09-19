import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GenericFormData, CidData, OPM, Procedimento, ProcedimentoData, SolicitanteData, PrestadorData, Diagnostico, PdfOutputAction, OpmSupplier, Option, FavoriteProcedure, FavoriteDiagnosis, NavSection } from '../types';
import { codeDescriptionFilter, procedureSearchFilter, solicitanteSearchFilter, prestadorSearchFilter, favoriteProcedureSearchFilter, favoriteDiagnosisSearchFilter } from '../utils/searchUtils';
import Section from '../components/Section';
import TextInput from '../components/form/TextInput';
import RadioGroup from '../components/form/RadioGroup';
import NumberInput from '../components/form/NumberInput';
import TextAreaInput from '../components/form/TextAreaInput';
import AutocompleteInput from '../components/form/AutocompleteInput';
import DateInput from '../components/form/DateInput';
import FileInput from './FileInput';
import SelectInput from '../components/form/SelectInput';
import SideNav from '../components/SideNav';

interface DetailedFormProps {
  formData: GenericFormData;
  setFormData: React.Dispatch<React.SetStateAction<GenericFormData>>;
  cidData: CidData[];
  tussData: ProcedimentoData[];
  cbhpmData: ProcedimentoData[];
  solicitantesData: SolicitanteData[];
  prestadoresData: PrestadorData[];
  opmKitsData: OpmSupplier[];
  favoriteProcedures: FavoriteProcedure[];
  favoriteDiagnoses: FavoriteDiagnosis[];
  onAddFavoriteProcedure: (procedure: Procedimento, tabela: string) => void;
  onDeleteFavoriteProcedure: (procedureId: string) => void;
  onAddFavoriteDiagnosis: (diagnosis: Diagnostico) => void;
  onDeleteFavoriteDiagnosis: (diagnosisId: string) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onGenerateAndSavePdf: (outputAction: PdfOutputAction) => void;
  onSaveFavorite: () => void;
  selectedPlan: string;
}

const sections: NavSection[] = [
  { key: 'beneficiario', label: '1. Dados do Beneficiário' },
  { key: 'solicitante', label: '2. Dados do Solicitante' },
  { key: 'internacao', label: '3. Dados da Internação' },
  { key: 'diagnostico', label: '4. Hipótese Diagnóstica' },
  { key: 'procedimentos', label: '5. Procedimentos' },
  { key: 'opm', label: '6. OPM Solicitados' },
  { key: 'finalizacao', label: '7. Finalização' },
];

const DetailedForm: React.FC<DetailedFormProps> = ({
  formData,
  setFormData,
  cidData,
  tussData,
  cbhpmData,
  solicitantesData,
  prestadoresData,
  opmKitsData,
  favoriteProcedures,
  favoriteDiagnoses,
  onAddFavoriteProcedure,
  onDeleteFavoriteProcedure,
  onAddFavoriteDiagnosis,
  onDeleteFavoriteDiagnosis,
  setToast,
  onGenerateAndSavePdf,
  onSaveFavorite,
  selectedPlan,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedOpmSupplier, setSelectedOpmSupplier] = useState('');
  const [diagnosisSource, setDiagnosisSource] = useState<'cid' | 'favorites'>('cid');

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeSection, setActiveSection] = useState<string>(sections[0].key);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkCompletion = () => {
      setCompletedSections({
        beneficiario: !!formData.nomeBeneficiario,
        solicitante: !!formData.nomeProfissionalSolicitante && !!formData.numeroConselho && !!formData.ufConselho && !!formData.conselhoProfissional,
        internacao: !!formData.nomePrestador && !!formData.caraterAtendimento && !!formData.tipoInternacao && !!formData.indicacaoClinica,
        diagnostico: !!formData.tipoDoenca && !!formData.diagnosticos[0]?.codigo,
        procedimentos: !!formData.procedimentos[0]?.codigo || !!formData.procedimentos[0]?.descricao,
        opm: true, // Optional section
        finalizacao: true, // Optional section
      });
    };
    checkCompletion();
  }, [formData]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-25% 0px -75% 0px', threshold: 0 }
    );
  
    sections.forEach((section) => {
      const el = sectionRefs.current[section.key];
      if (el) {
        observer.observe(el);
      }
    });
  
    return () => {
      sections.forEach((section) => {
        const el = sectionRefs.current[section.key];
        if (el) {
          observer.unobserve(el);
        }
      });
    };
  }, []);

  const handleNavClick = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


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

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    setFormData(prev => ({ 
        ...prev, 
        procedimentos: [{ id: uuidv4(), tabela: '', codigo: '', descricao: '', quantidade: 1, quantidadeAutorizada: 0 }] 
    }));
  }, [formData.procedimentoTabela, setFormData]);


  const handleFileChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [setFormData]);
  
  const addProcedimento = () => {
    if (formData.procedimentos.length < 5) {
      setFormData(prev => ({
        ...prev,
        procedimentos: [...prev.procedimentos, { id: uuidv4(), tabela: '', codigo: '', descricao: '', quantidade: 1, quantidadeAutorizada: 0 }]
      }));
    }
  };

  const removeProcedimento = (id: string) => {
    setFormData(prev => ({
      ...prev,
      procedimentos: prev.procedimentos.filter(p => p.id !== id)
    }));
  };

  const handleProcedimentoChange = <T extends keyof Procedimento>(id: string, field: T, value: Procedimento[T]) => {
     setFormData(prev => ({
      ...prev,
      procedimentos: prev.procedimentos.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };
  
  const addOpm = () => {
    if (formData.opm.length < 5) {
      setFormData(prev => ({
        ...prev,
        opm: [...prev.opm, { id: uuidv4(), tabela: '', codigo: '', descricao: '', quantidade: 0, fabricante: '', valorUnitario: 0 }]
      }));
    }
  };

  const removeOpm = (id: string) => {
    setFormData(prev => ({
      ...prev,
      opm: prev.opm.filter(o => o.id !== id)
    }));
  };
  
  const handleOpmChange = <T extends keyof OPM>(id: string, field: T, value: OPM[T]) => {
     setFormData(prev => ({
      ...prev,
      // FIX: Corrected a typo in the object spread from `...p` to `...o` to correctly reference the array item being mapped.
      opm: prev.opm.map(o => o.id === id ? { ...o, [field]: value } : o)
    }));
  };

  const addDiagnostico = () => {
    if (formData.diagnosticos.length < 4) {
      setFormData(prev => ({
        ...prev,
        diagnosticos: [...prev.diagnosticos, { id: uuidv4(), codigo: '', descricao: '' }]
      }));
    }
  };

  const removeDiagnostico = (id: string) => {
    setFormData(prev => ({
      ...prev,
      diagnosticos: prev.diagnosticos.filter(d => d.id !== id)
    }));
  };

  const handleDiagnosticoChange = <T extends keyof Diagnostico>(id: string, field: T, value: Diagnostico[T]) => {
     setFormData(prev => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };
  
  const handleDayClinicToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
        ...prev,
        qtdeDiariasSolicitadas: isChecked ? 'Day Clinic' : 1,
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
  
  const downloadJson = (data: object, filename: string) => {
    const sanitizedData: Partial<GenericFormData> = { ...data };

    // Blank out beneficiary data
    sanitizedData.nomeBeneficiario = '';
    sanitizedData.numeroCarteira = '';
    sanitizedData.validadeCarteira = '';
    sanitizedData.atendimentoRN = 'N';
    sanitizedData.nomeSocial = '';
    sanitizedData.numeroCartaoNacionalSaude = '';

    // Blank out solicitor data
    sanitizedData.codigoOperadora = '';
    sanitizedData.nomeContratado = '';

    // Blank out requested provider data
    sanitizedData.nomePrestador = '';
    
    const jsonString = JSON.stringify(sanitizedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportGuide = () => {
    if (!validateAndScroll()) return;
  
    const sanitizeFilename = (str: string) => {
      return (str || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
    };

    const procedureName = sanitizeFilename(formData.procedimentos[0]?.descricao || 'Guia_Detalhada');
    const date = new Date().toISOString().split('T')[0];
    const filename = `${procedureName}_${date}.json`;
    
    downloadJson(formData, filename);
    setToast({ message: `Guia exportada como '${filename}'!`, type: 'success' });
  };
  
  const handleSaveAsFavorite = () => {
    if (!validateAndScroll()) return;
    onSaveFavorite();
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierName = e.target.value;
    setSelectedOpmSupplier(supplierName);

    if (!supplierName) return;

    const supplier = opmKitsData.find(s => s.fornecedor === supplierName);
    const primaryProcedure = formData.procedimentos[0];

    if (supplier && primaryProcedure?.codigo) {
      const kit = supplier.kits.find(k => k.procedimentoCodigo === primaryProcedure.codigo);
      if (kit) {
        const newOpmItems = kit.opm.map(item => ({
          ...item,
          id: uuidv4(),
          tabela: '',
          codigo: '',
          fabricante: supplierName,
          valorUnitario: 0,
        }));
        setFormData(prev => ({ ...prev, opm: newOpmItems }));
        setToast({ message: `Kit de OPM de '${supplierName}' aplicado.`, type: 'success' });
      } else {
        setToast({ message: `Nenhum kit de OPM encontrado para este procedimento com '${supplierName}'.`, type: 'error' });
      }
    } else {
         if (supplier) {
             setToast({ message: 'Selecione um procedimento principal para carregar um kit de OPM.', type: 'error' });
         }
    }
  };

  const getProcedimentoDataSource = () => {
    switch (formData.procedimentoTabela) {
        case 'tuss': return tussData;
        case 'cbhpm': return cbhpmData;
        case 'favorites': return favoriteProcedures;
        default: return [];
    }
  };
  const procedimentoDataSource = getProcedimentoDataSource();
  
  const getFilterFn = () => {
    if (formData.procedimentoTabela === 'favorites') {
        return favoriteProcedureSearchFilter;
    }
    return procedureSearchFilter;
  };
  const filterFn = getFilterFn();

  const displayProcFn = (item: ProcedimentoData | FavoriteProcedure) => {
    if ('tabela' in item && item.tabela) { // It's a FavoriteProcedure
        const tableName = item.tabela === 'cbhpm' ? 'CBHPM 22' : item.tabela.toUpperCase();
        return `(${tableName}) ${item.codigo} - ${item.descricao}`;
    }
    return `${item.codigo} - ${item.descricao}`;
  };

  const displayCidFn = (item: CidData | FavoriteDiagnosis) => `${item.codigo} - ${item.descricao}`;
  const solicitanteDisplayFn = (item: SolicitanteData) => item.nomeProfissionalSolicitante;
  const prestadorDisplayFn = (item: PrestadorData) => item.nome;
  const opmSupplierOptions: Option[] = opmKitsData.map(s => ({ value: s.fornecedor, label: s.fornecedor }));

  return (
    <div className="flex flex-col lg:flex-row gap-8">
       <SideNav 
          sections={sections}
          activeSection={activeSection}
          completedSections={completedSections}
          onNavClick={handleNavClick}
      />
      <div className="flex-grow lg:w-3/4">
        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <Section ref={(el) => { sectionRefs.current['beneficiario'] = el; }} id="beneficiario" title="1. Dados do Beneficiário">
            <TextInput label="Nome do Beneficiário" name="nomeBeneficiario" value={formData.nomeBeneficiario} onChange={handleChange} required className="col-span-1 md:col-span-2 lg:col-span-3"/>
          </Section>
          
          <Section ref={(el) => { sectionRefs.current['solicitante'] = el; }} id="solicitante" title="2. Dados do Contratado Solicitante">
            <AutocompleteInput<SolicitanteData>
                label="Nome do Profissional Solicitante"
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
            />
            <TextInput label="Conselho Profissional" name="conselhoProfissional" value={formData.conselhoProfissional} onChange={handleChange} required />
            <TextInput label="Número no Conselho" name="numeroConselho" value={formData.numeroConselho} onChange={handleChange} required />
            <TextInput label="UF do Conselho" name="ufConselho" value={formData.ufConselho} onChange={handleChange} required />
          </Section>

          <Section ref={(el) => { sectionRefs.current['internacao'] = el; }} id="internacao" title="3. Dados do Contratado Solicitado / Internação">
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
                className="col-span-1 md:col-span-2"
            />
            <RadioGroup legend="Caráter de Atendimento" name="caraterAtendimento" value={formData.caraterAtendimento} onChange={handleChange} options={[{value: 'E', label: 'Eletiva'}, {value: 'U', label: 'Urgência/Emergência'}]} required />
            <RadioGroup legend="Tipo de Internação" name="tipoInternacao" value={formData.tipoInternacao} onChange={handleChange} options={[{value: '1', label: 'Clínica'}, {value: '2', label: 'Cirúrgica'}, {value: '3', label: 'Obstétrica'}, {value: '4', label: 'Pediátrica'}, {value: '5', label: 'Psiquiátrica'}]} required className="col-span-1 md:col-span-2 lg:col-span-3" />
            <div className="flex items-end gap-4">
                <div className="flex-grow">
                    <TextInput 
                        label="Qtde. de Diárias Solicitadas" 
                        name="qtdeDiariasSolicitadas" 
                        value={String(formData.qtdeDiariasSolicitadas)} 
                        onChange={handleChange} 
                        readOnly={formData.qtdeDiariasSolicitadas === 'Day Clinic'}
                    />
                </div>
                <div className="flex items-center pb-2 h-10">
                    <input
                        type="checkbox"
                        id="dayClinic"
                        name="dayClinic"
                        checked={formData.qtdeDiariasSolicitadas === 'Day Clinic'}
                        onChange={handleDayClinicToggle}
                        className="h-5 w-5 text-secondary focus:ring-secondary border-gray-300 rounded"
                    />
                    <label htmlFor="dayClinic" className="ml-2 font-medium text-gray-700">
                        Day Clinic
                    </label>
                </div>
            </div>
            <TextAreaInput label="Indicação Clínica" name="indicacaoClinica" value={formData.indicacaoClinica} onChange={handleChange} required className="col-span-1 md:col-span-2 lg:col-span-3" />
          </Section>

          <Section ref={(el) => { sectionRefs.current['diagnostico'] = el; }} id="diagnostico" title="4. Hipótese Diagnóstica">
            <RadioGroup legend="Tipo de Doença" name="tipoDoenca" value={formData.tipoDoenca} onChange={handleChange} options={[{value: 'A', label: 'Aguda'}, {value: 'C', label: 'Crônica'}]} required className="lg:col-span-1" />
            <div className="flex gap-2 items-end lg:col-span-2">
              <NumberInput label="Tempo de Doença" name="tempoDoencaNumero" value={formData.tempoDoencaNumero} onChange={handleChange} min={0} />
              <SelectInput label="Unidade" name="tempoDoencaUnidade" value={formData.tempoDoencaUnidade} onChange={handleChange} options={[{value: 'A', label: 'Anos'}, {value: 'M', label: 'Meses'}, {value: 'D', label: 'Dias'}]} />
            </div>
            <div className="col-span-full space-y-4">
                <RadioGroup
                  legend="Fonte da Busca"
                  name="diagnosisSource"
                  value={diagnosisSource}
                  onChange={(e) => setDiagnosisSource(e.target.value as 'cid' | 'favorites')}
                  options={[
                      { value: 'cid', label: 'CID-10' },
                      { value: 'favorites', label: 'Favoritos' },
                  ]}
                  className="col-span-full"
                />
                {formData.diagnosticos.map((diag, index) => (
                    <div key={diag.id} className="flex items-end gap-2 p-3 bg-light rounded-md">
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4">
                                <AutocompleteInput<CidData | FavoriteDiagnosis>
                                    label={index === 0 ? "CID Principal (Código)" : `CID ${index + 1} (Código)`}
                                    name={`diag-codigo-${diag.id}`}
                                    value={diag.codigo}
                                    onChange={(e) => handleDiagnosticoChange(diag.id, 'codigo', e.target.value)}
                                    onSelect={(item) => {
                                        handleDiagnosticoChange(diag.id, 'codigo', item.codigo);
                                        handleDiagnosticoChange(diag.id, 'descricao', item.descricao);
                                    }}
                                    data={diagnosisSource === 'cid' ? cidData : favoriteDiagnoses}
                                    filterFn={diagnosisSource === 'cid' ? codeDescriptionFilter : favoriteDiagnosisSearchFilter as any}
                                    displayFn={displayCidFn}
                                    onDeleteItem={diagnosisSource === 'favorites' ? (item) => onDeleteFavoriteDiagnosis((item as FavoriteDiagnosis).id) : undefined}
                                />
                            </div>
                            <div className="md:col-span-8">
                                <AutocompleteInput<CidData | FavoriteDiagnosis>
                                    label="Descrição"
                                    name={`diag-descricao-${diag.id}`}
                                    value={diag.descricao}
                                    onChange={(e) => handleDiagnosticoChange(diag.id, 'descricao', e.target.value)}
                                    onSelect={(item) => {
                                        handleDiagnosticoChange(diag.id, 'codigo', item.codigo);
                                        handleDiagnosticoChange(diag.id, 'descricao', item.descricao);
                                    }}
                                    data={diagnosisSource === 'cid' ? cidData : favoriteDiagnoses}
                                    filterFn={diagnosisSource === 'cid' ? codeDescriptionFilter : favoriteDiagnosisSearchFilter as any}
                                    displayFn={displayCidFn}
                                    onDeleteItem={diagnosisSource === 'favorites' ? (item) => onDeleteFavoriteDiagnosis((item as FavoriteDiagnosis).id) : undefined}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onAddFavoriteDiagnosis(diag)}
                              disabled={!diag.codigo}
                              className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                              aria-label="Adicionar diagnóstico aos favoritos"
                              title="Adicionar diagnóstico aos favoritos"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => removeDiagnostico(diag.id)}
                                className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                aria-label="Remover Diagnóstico"
                                title="Remover Diagnóstico"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                        </div>
                    </div>
                ))}
                {formData.diagnosticos.length < 4 && (
                    <button type="button" onClick={addDiagnostico} className="mt-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-blue-700">Adicionar CID</button>
                )}
            </div>
          </Section>

          <Section ref={(el) => { sectionRefs.current['procedimentos'] = el; }} id="procedimentos" title="5. Procedimentos Solicitados">
            <div className="col-span-full space-y-4">
                 <RadioGroup 
                    legend="Tabela de Procedimento"
                    name="procedimentoTabela"
                    value={formData.procedimentoTabela}
                    onChange={handleChange}
                    options={[
                        {value: 'favorites', label: 'Favoritos'},
                        {value: 'cbhpm', label: 'CBHPM 22'}, 
                        {value: 'tuss', label: 'TUSS'}, 
                        {value: 'manual', label: 'Inserir Manualmente'}
                    ]}
                    required
                 />
                {formData.procedimentos.map((proc, index) => (
                    <div key={proc.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-3 bg-light rounded-md">
                        {formData.procedimentoTabela === 'manual' ? (
                          <>
                            <div className="md:col-span-4">
                              <TextInput
                                label={`Código do Procedimento #${index + 1}`}
                                name={`proc-codigo-${proc.id}`}
                                value={proc.codigo}
                                onChange={(e) => handleProcedimentoChange(proc.id, 'codigo', e.target.value)}
                              />
                            </div>
                            <div className="md:col-span-6">
                              <TextInput
                                label="Descrição"
                                name={`proc-descricao-${proc.id}`}
                                value={proc.descricao}
                                onChange={(e) => handleProcedimentoChange(proc.id, 'descricao', e.target.value)}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="md:col-span-4">
                                <AutocompleteInput<ProcedimentoData | FavoriteProcedure>
                                    label={`Código do Procedimento #${index + 1}`}
                                    name={`proc-codigo-${proc.id}`}
                                    value={proc.codigo}
                                    onChange={(e) => handleProcedimentoChange(proc.id, 'codigo', e.target.value)}
                                    onSelect={(item) => {
                                        handleProcedimentoChange(proc.id, 'codigo', item.codigo);
                                        handleProcedimentoChange(proc.id, 'descricao', item.descricao);
                                    }}
                                    data={procedimentoDataSource}
                                    filterFn={filterFn as any}
                                    displayFn={displayProcFn as any}
                                    onDeleteItem={formData.procedimentoTabela === 'favorites' ? (item) => onDeleteFavoriteProcedure((item as FavoriteProcedure).id) : undefined}
                                />
                            </div>
                             <div className="md:col-span-6">
                                <AutocompleteInput<ProcedimentoData | FavoriteProcedure>
                                    label="Descrição"
                                    name={`proc-descricao-${proc.id}`}
                                    value={proc.descricao}
                                    onChange={(e) => handleProcedimentoChange(proc.id, 'descricao', e.target.value)}
                                    onSelect={(item) => {
                                        handleProcedimentoChange(proc.id, 'codigo', item.codigo);
                                        handleProcedimentoChange(proc.id, 'descricao', item.descricao);
                                    }}
                                    data={procedimentoDataSource}
                                    filterFn={filterFn as any}
                                    displayFn={displayProcFn as any}
                                    onDeleteItem={formData.procedimentoTabela === 'favorites' ? (item) => onDeleteFavoriteProcedure((item as FavoriteProcedure).id) : undefined}
                                />
                            </div>
                          </>
                        )}
                        <div className="md:col-span-1">
                            <NumberInput label="Qtde." name={`proc-qtd-${proc.id}`} value={proc.quantidade} onChange={(e) => handleProcedimentoChange(proc.id, 'quantidade', parseInt(e.target.value, 10) || 0)} min={1} />
                        </div>
                        <div className="md:col-span-1 flex items-center justify-end gap-1">
                            <button
                                type="button"
                                onClick={() => onAddFavoriteProcedure(proc, formData.procedimentoTabela)}
                                disabled={formData.procedimentoTabela === 'favorites' || formData.procedimentoTabela === 'manual' || !proc.codigo}
                                className="h-10 w-10 flex items-center justify-center bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                aria-label="Adicionar aos favoritos"
                                title="Adicionar aos favoritos"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                            <button 
                              type="button" 
                              onClick={() => removeProcedimento(proc.id)} 
                              className="h-10 w-10 flex items-center justify-center bg-red-500 text-white rounded-md hover:bg-red-600"
                              aria-label="Remover Procedimento"
                              title="Remover Procedimento"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                        </div>
                    </div>
                ))}
                {formData.procedimentos.length < 5 && (
                    <button type="button" onClick={addProcedimento} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-blue-700">Adicionar Procedimento</button>
                )}
            </div>
          </Section>
          
          <Section ref={(el) => { sectionRefs.current['opm'] = el; }} id="opm" title="6. OPM Solicitados">
            <div className="col-span-full mb-4">
                <SelectInput 
                    label="Carregar Kit Sugerido por Fornecedor"
                    name="opmSupplier"
                    value={selectedOpmSupplier}
                    onChange={handleSupplierChange}
                    options={opmSupplierOptions}
                />
            </div>
            <div className="col-span-full space-y-4">
                {formData.opm.map((opmItem, index) => (
                    <div key={opmItem.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-3 bg-light rounded-md">
                        <div className="md:col-span-8">
                            <TextInput label={`Descrição OPM #${index + 1}`} name={`opm-desc-${opmItem.id}`} value={opmItem.descricao} onChange={(e) => handleOpmChange(opmItem.id, 'descricao', e.target.value)} />
                        </div>
                        <div className="md:col-span-3">
                            <NumberInput label="Quantidade" name={`opm-qtd-${opmItem.id}`} value={opmItem.quantidade} onChange={(e) => handleOpmChange(opmItem.id, 'quantidade', parseInt(e.target.value, 10) || 0)} min={0} emptyOnZero />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeOpm(opmItem.id)} 
                          className="md:col-span-1 h-10 flex items-center justify-center bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          aria-label="Remover OPM"
                          title="Remover OPM"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                    </div>
                ))}
                {formData.opm.length < 5 && (
                    <button type="button" onClick={addOpm} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-blue-700">Adicionar OPM</button>
                )}
            </div>
          </Section>

           <Section ref={(el) => { sectionRefs.current['finalizacao'] = el; }} id="finalizacao" title="7. Finalização">
            <TextAreaInput label="Observação" name="observacaoJustificativa" value={formData.observacaoJustificativa} onChange={handleChange} className="col-span-full" />
            <DateInput label="Data da Assinatura do Médico" name="dataSolicitacao" value={formData.dataSolicitacao} onChange={handleChange} />
            <FileInput label="Assinatura do Médico (PNG/JPG)" name="assinaturaMedicoImage" value={formData.assinaturaMedicoImage} onChange={handleFileChange} />
          </Section>

          <div className="mt-8 p-4 bg-white shadow-md rounded-lg">
            <div className="flex justify-end items-center gap-4">
              <button type="button" onClick={handleSaveAsFavorite} className="px-4 py-2 bg-accent text-primary font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Salvar Favorito
              </button>
              <button type="button" onClick={handleExportGuide} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Guia
              </button>
              <div className="flex items-center gap-2 border-l-2 pl-4 ml-2">
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
      </div>
    </div>
  );
};

export default DetailedForm;