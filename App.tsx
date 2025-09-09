// FIX: Imported useState, useEffect, and useCallback from React to fix 'Cannot find name' errors and corrected import syntax.
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GenericFormData, CidData, ProcedimentoData, SolicitanteData, PrestadorData, QuickFillProcedureData, Mapping, PdfOutputAction, GuideHistoryEntry } from './types';
import Header from './components/Header';
import PlanSelector from './components/PlanSelector';
import FillModeSelector from './components/form/FillModeSelector';
import QuickFillForm from './forms/QuickFillForm';
import DetailedForm from './forms/DetailedForm';
import Spinner from './components/Spinner';
import Footer from './components/Footer';
import Toast from './components/Toast';
import InfoSections from './components/InfoSections';
import { setupLocalForage, saveData, loadData } from './utils/localforage';
import { healthPlans } from './utils/constants';
import HistoryModal from './components/HistoryModal';
import { generatePdfForPlan } from './utils/pdfService';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const emptyFormData: GenericFormData = {
  // Dados Cabeçalho
  registroANS: '',
  guiaNoPrestador: '',
  numeroGuiaAtribuidoOperadora: '',
  dataAutorizacao: '',
  senha: '',
  dataValidadeSenha: '',
  dataEmissaoGuia: '',
  
  // Dados Beneficiário
  nomeBeneficiario: '',
  numeroCarteira: '',
  validadeCarteira: '',
  atendimentoRN: 'N',
  nomeSocial: '',
  numeroCartaoNacionalSaude: '',
  
  // Dados Contratado Solicitante
  codigoOperadora: '',
  nomeContratado: '',
  nomeProfissionalSolicitante: '',
  conselhoProfissional: 'CRM',
  numeroConselho: '',
  ufConselho: 'RN',
  codigoCBO: '',

  // Dados Hospital/Local Solicitado/Dados da Internação
  codigoOperadoraCNPJ: '',
  nomePrestador: '',
  nomeHospitalSolicitado: '',
  caraterAtendimento: 'E', 
  tipoInternacao: '',
  regimeInternacao: '1',
  qtdeDiariasSolicitadas: 1,
  indicacaoClinica: '',
  dataSugeridaInternacao: '',
  previsaoUsoOPME: '',
  previsaoUsoQuimio: '',

  // Hipótese Diagnóstica
  tipoDoenca: '',
  tempoDoencaNumero: 0,
  tempoDoencaUnidade: '',
  indicacaoAcidente: '0',
  diagnosticos: [{ id: uuidv4(), codigo: '', descricao: '' }],
  
  // Procedimentos
  procedimentoTabela: 'cbhpm', 
  procedimentos: [{ id: uuidv4(), tabela: '', codigo: '', descricao: '', quantidade: 1, quantidadeAutorizada: 0 }],
  quickFillProcedure: '',
  
  // OPM
  opm: [],

  // Autorização
  dataProvavelAdmissao: '',
  qtdeDiariasAutorizadas: 0,
  tipoAcomodacaoAutorizada: '',
  codigoOperadoraCNPJAutorizado: '',
  nomeHospitalAutorizado: '',
  codigoCNES: '',
  codigoCNESAutorizado: '',
  observacaoJustificativa: '',

  // Finalização
  dataSolicitacao: new Date().toISOString().split('T')[0],
  assinaturaMedicoImage: '',
  assinaturaBeneficiarioImage: '',
  assinaturaResponsavelImage: '',
  dataAssinaturaResponsavelAutorizacao: '',
};

const App: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [fillMode, setFillMode] = useState<'detailed' | 'quick'>('detailed');
  const [formData, setFormData] = useState<GenericFormData>(emptyFormData);
  const [cidData, setCidData] = useState<CidData[]>([]);
  const [tussData, setTussData] = useState<ProcedimentoData[]>([]);
  const [cbhpmData, setCbhpmData] = useState<ProcedimentoData[]>([]);
  const [solicitantesData, setSolicitantesData] = useState<SolicitanteData[]>([]);
  const [prestadoresData, setPrestadoresData] = useState<PrestadorData[]>([]);
  const [quickFillProcedures, setQuickFillProcedures] = useState<QuickFillProcedureData[]>([]);
  const [userQuickFillProcedures, setUserQuickFillProcedures] = useState<QuickFillProcedureData[]>([]);
  const [backgroundImages, setBackgroundImages] = useState<{ [key: string]: string }>({});
  const [mappings, setMappings] = useState<{ [key: string]: Mapping }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [history, setHistory] = useState<GuideHistoryEntry[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  useEffect(() => {
    setupLocalForage();
    
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchAndEncodeImage = async (url: string): Promise<string> => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Falha ao buscar imagem local: ${url}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };
        
        const fetchJson = async (url: string) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Falha ao buscar JSON: ${url}`);
            }
            return response.json();
        }

        const imageBaseUrl = '/assets/images/';
        const mappingsBaseUrl = '/assets/data/mappings/';
        
        const dataFetches = [
          loadData<string>('selectedPlan'),
          loadData<'detailed' | 'quick'>('fillMode'),
          loadData<GenericFormData>('genericFormData'),
          loadData<QuickFillProcedureData[]>('userQuickFillProcedures'),
          loadData<GuideHistoryEntry[]>('medicalGuidesHistory'),
          fetchJson('/assets/data/CID-10.json'),
          fetchJson('/assets/data/procedimentos_TUSS.json'),
          fetchJson('/assets/data/procedimentos_CBHPM.json'),
          fetchJson('/assets/data/solicitantes.json'),
          fetchJson('/assets/data/prestadores.json'),
          fetchJson('/assets/data/procedimentos-rapidos.json'),
        ];
        
        const imageFetches = healthPlans.map(plan => 
            fetchAndEncodeImage(`${imageBaseUrl}${plan.value.toLowerCase()}_form.png`)
        );
        
        const mappingFetches = healthPlans.map(plan =>
            fetchJson(`${mappingsBaseUrl}${plan.value.toLowerCase()}.json`)
        );

        const [
            loadedPlan, loadedMode, loadedFormData, loadedUserQuickFills, loadedHistory,
            cidJson, tussJson, cbhpmJson, solicitantesJson, prestadoresJson, quickFillJson,
            ...imagesAndMappings
        ] = await Promise.all([...dataFetches, ...imageFetches, ...mappingFetches]);
        
        const images = imagesAndMappings.slice(0, healthPlans.length) as string[];
        const mappingData = imagesAndMappings.slice(healthPlans.length) as Mapping[];

        if (loadedPlan) setSelectedPlan(loadedPlan);
        if (loadedMode) setFillMode(loadedMode);
        if (loadedFormData) {
            setFormData(prev => ({...emptyFormData, ...prev, ...loadedFormData}));
        }
        if (loadedUserQuickFills) {
            if (Array.isArray(loadedUserQuickFills)) {
                setUserQuickFillProcedures(loadedUserQuickFills);
            } else {
                console.warn("Dados de preenchimento rápido do usuário estavam corrompidos e foram resetados.");
                await saveData('userQuickFillProcedures', []);
            }
        }
        if (loadedHistory && Array.isArray(loadedHistory)) {
            setHistory(loadedHistory);
        }

        setCidData(cidJson);
        setTussData(tussJson);
        setCbhpmData(cbhpmJson);
        setSolicitantesData(solicitantesJson);
        setPrestadoresData(prestadoresJson);
        setQuickFillProcedures(quickFillJson);

        const imageMap = healthPlans.reduce((acc, plan, index) => {
            acc[plan.value] = images[index];
            return acc;
        }, {} as { [key: string]: string });
        setBackgroundImages(imageMap);

        const mappingMap = healthPlans.reduce((acc, plan, index) => {
            acc[plan.value] = mappingData[index];
            return acc;
        }, {} as { [key: string]: Mapping });
        setMappings(mappingMap);

      } catch (err) {
        console.error(err);
        if (err instanceof Error && err.message.includes('Falha ao buscar')) {
             setError('Não foi possível carregar arquivos essenciais (imagens ou JSON). Verifique se todos os arquivos necessários existem nas pastas public/assets e se os nomes correspondem aos planos de saúde.');
        } else {
             setError('Não foi possível carregar os dados. Por favor, recarregue a página.');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if(!loading) {
        saveData('selectedPlan', selectedPlan);
    }
  }, [selectedPlan, loading]);
  
  useEffect(() => {
    if(!loading) {
        saveData('fillMode', fillMode);
    }
  }, [fillMode, loading]);


  useEffect(() => {
    if(!loading) {
        saveData('genericFormData', formData);
    }
  }, [formData, loading]);

  const handlePlanChange = useCallback((plan: string) => {
    setSelectedPlan(plan);
  }, []);

  const handleFillModeChange = useCallback((mode: 'detailed' | 'quick') => {
    setFillMode(mode);
  }, []);
  
  const handleGenerateAndSaveHistory = useCallback(async (outputAction: PdfOutputAction) => {
    try {
        const completedFormData = {
            ...formData,
            dataSolicitacao: formData.dataSolicitacao || new Date().toISOString().split('T')[0],
        };

        const newHistoryEntry: GuideHistoryEntry = {
            id: uuidv4(),
            generatedAt: new Date().toISOString(),
            planName: selectedPlan,
            patientName: completedFormData.nomeBeneficiario,
            formData: completedFormData,
        };

        const currentHistory = await loadData<GuideHistoryEntry[]>('medicalGuidesHistory') || [];
        const updatedHistory = [newHistoryEntry, ...currentHistory].slice(0, 50); // Limita o histórico
        await saveData('medicalGuidesHistory', updatedHistory);
        setHistory(updatedHistory);

        setFormData(completedFormData);

        generatePdfForPlan(selectedPlan, completedFormData, backgroundImages, mappings, outputAction);

        setToast({ message: 'Guia salva no histórico e PDF processado!', type: 'success' });
        
    } catch (error) {
        console.error("Falha ao salvar no histórico ou gerar PDF:", error);
        setToast({ message: 'Erro ao processar a guia. Verifique o console.', type: 'error' });
    }
}, [formData, selectedPlan, backgroundImages, mappings]);

const handleLoadHistoryEntry = useCallback((entry: GuideHistoryEntry) => {
    setSelectedPlan(entry.planName);
    setFormData(entry.formData);
    setIsHistoryVisible(false);
    setToast({ message: `Guia de ${entry.patientName || 'paciente'} carregada do histórico.`, type: 'success' });
}, []);


  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8"><Spinner /> <p>Carregando dados e recursos...</p></div>;
    }
    if (error) {
      return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }
    
    const formArea = () => {
        if (!selectedPlan) {
          return null;
        }

        if (fillMode === 'quick') {
          const allQuickFills = [...quickFillProcedures, ...userQuickFillProcedures];
          const quickProps = { 
            formData, 
            setFormData, 
            solicitantesData, 
            prestadoresData, 
            quickFillProcedures: allQuickFills, 
            setToast,
            onFillModeChange: handleFillModeChange,
            onGenerateAndSavePdf: handleGenerateAndSaveHistory,
          };
          return <QuickFillForm {...quickProps} />;
        }
        
        const detailedFormProps = { 
          formData, 
          setFormData, 
          cidData, 
          tussData, 
          cbhpmData, 
          solicitantesData, 
          prestadoresData,
          setToast,
          onGenerateAndSavePdf: handleGenerateAndSaveHistory,
        };
        return <DetailedForm {...detailedFormProps} />;
    }

    return (
        <div className="space-y-8">
            <PlanSelector selectedPlan={selectedPlan} onPlanChange={handlePlanChange} />
            <InfoSections startExpanded={!selectedPlan} />
            {selectedPlan && <FillModeSelector fillMode={fillMode} onFillModeChange={handleFillModeChange} />}
            {formArea()}
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onShowHistory={() => setIsHistoryVisible(true)} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className="container mx-auto p-4 md:p-8 flex-grow">
          {renderContent()}
      </main>
      <HistoryModal
        isOpen={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
        history={history}
        onLoad={handleLoadHistoryEntry}
      />
      <Footer />
    </div>
  );
};

export default App;