// FIX: Imported useState, useEffect, and useCallback from React to fix 'Cannot find name' errors and corrected import syntax.
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GenericFormData, CidData, ProcedimentoData, SolicitanteData, PrestadorData, QuickFillProcedureData, PdfOutputAction, GuideHistoryEntry, FavoriteGuideEntry, OpmSupplier, FavoriteProcedure, Procedimento, FavoriteDiagnosis, Diagnostico } from './types';
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
import HistoryModal from './components/HistoryModal';
import FavoritesModal from './components/FavoritesModal';
import { generatePdfForPlan } from './utils/pdfService';
import SaveFavoriteModal from './components/SaveFavoriteModal';
import PasswordModal from './components/mapping/PasswordModal';
import MappingEditor from './components/mapping/MappingEditor';

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

type PasswordAction = 'mapping' | 'exportFavorites';

const App: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [fillMode, setFillMode] = useState<'detailed' | 'quick' | null>(null);
  const [formData, setFormData] = useState<GenericFormData>(emptyFormData);
  const [cidData, setCidData] = useState<CidData[]>([]);
  const [tussData, setTussData] = useState<ProcedimentoData[]>([]);
  const [cbhpmData, setCbhpmData] = useState<ProcedimentoData[]>([]);
  const [solicitantesData, setSolicitantesData] = useState<SolicitanteData[]>([]);
  const [prestadoresData, setPrestadoresData] = useState<PrestadorData[]>([]);
  const [quickFillProcedures, setQuickFillProcedures] = useState<QuickFillProcedureData[]>([]);
  const [userQuickFillProcedures, setUserQuickFillProcedures] = useState<QuickFillProcedureData[]>([]);
  const [opmKitsData, setOpmKitsData] = useState<OpmSupplier[]>([]);
  const [favoriteProcedures, setFavoriteProcedures] = useState<FavoriteProcedure[]>([]);
  const [favoriteDiagnoses, setFavoriteDiagnoses] = useState<FavoriteDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [history, setHistory] = useState<GuideHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteGuideEntry[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isFavoritesVisible, setIsFavoritesVisible] = useState(false);
  const [isSaveFavoriteModalVisible, setIsSaveFavoriteModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordModalAction, setPasswordModalAction] = useState<PasswordAction | null>(null);
  const [isMappingEditorVisible, setIsMappingEditorVisible] = useState(false);

  useEffect(() => {
    setupLocalForage();
    
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchJson = async (url: string) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Falha ao buscar JSON: ${url}`);
            }
            return response.json();
        }

        const dataFetches = [
          loadData<string>('selectedPlan'),
          loadData<'detailed' | 'quick' | null>('fillMode'),
          loadData<GenericFormData>('genericFormData'),
          loadData<QuickFillProcedureData[]>('userQuickFillProcedures'),
          loadData<GuideHistoryEntry[]>('medicalGuidesHistory'),
          loadData<FavoriteGuideEntry[]>('medicalGuidesFavorites'),
          loadData<FavoriteProcedure[]>('favoriteProcedures'),
          loadData<FavoriteDiagnosis[]>('favoriteDiagnoses'),
          fetchJson('/assets/data/CID-10.json'),
          fetchJson('/assets/data/procedimentos_TUSS.json'),
          fetchJson('/assets/data/procedimentos_CBHPM.json'),
          fetchJson('/assets/data/solicitantes.json'),
          fetchJson('/assets/data/prestadores.json'),
          fetchJson('/assets/data/procedimentos-rapidos.json'),
          fetchJson('/assets/data/opm-kits.json'),
        ];
        
        const [
            loadedPlan, loadedMode, loadedFormData, loadedUserQuickFills, loadedHistory, loadedFavorites, loadedFavoriteProcedures, loadedFavoriteDiagnoses,
            cidJson, tussJson, cbhpmJson, solicitantesJson, prestadoresJson, quickFillJson, opmKitsJson
        ] = await Promise.all(dataFetches);
        
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
        if (loadedFavorites && Array.isArray(loadedFavorites)) {
            setFavorites(loadedFavorites);
        }
        if (loadedFavoriteProcedures && Array.isArray(loadedFavoriteProcedures)) {
            setFavoriteProcedures(loadedFavoriteProcedures);
        }
         if (loadedFavoriteDiagnoses && Array.isArray(loadedFavoriteDiagnoses)) {
            setFavoriteDiagnoses(loadedFavoriteDiagnoses);
        }

        setCidData(cidJson);
        setTussData(tussJson);
        setCbhpmData(cbhpmJson);
        setSolicitantesData(solicitantesJson);
        setPrestadoresData(prestadoresJson);
        setQuickFillProcedures(quickFillJson);
        setOpmKitsData(opmKitsJson);

      } catch (err) {
        console.error(err);
        if (err instanceof Error && err.message.includes('Falha ao buscar')) {
             setError('Não foi possível carregar arquivos essenciais de dados (JSON). Verifique se todos os arquivos necessários existem na pasta public/assets/data.');
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
    setFillMode(null);
  }, []);

  const handleFillModeChange = useCallback((mode: 'detailed' | 'quick') => {
    setFillMode(mode);
  }, []);
  
  const handlePdfAction = useCallback(async (outputAction: PdfOutputAction) => {
    try {
        const completedFormData = {
            ...formData,
            dataSolicitacao: formData.dataSolicitacao || new Date().toISOString().split('T')[0],
        };

        // Salva no histórico para ações que finalizam a guia (download, impressão)
        if (outputAction === 'download' || outputAction === 'print') {
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
            setToast({ message: 'Guia salva no histórico e PDF processado!', type: 'success' });
        } else if (outputAction === 'view') {
            setToast({ message: 'Visualização da guia gerada com sucesso!', type: 'success' });
        }

        setFormData(completedFormData);
        generatePdfForPlan(selectedPlan, completedFormData, outputAction);
        
    } catch (error) {
        console.error(`Falha ao processar PDF para ação: ${outputAction}`, error);
        const actionTextMap = { view: 'visualização', download: 'download', print: 'impressão' };
        const actionText = actionTextMap[outputAction] || 'processamento';
        setToast({ message: `Erro ao processar a guia para ${actionText}. Verifique o console.`, type: 'error' });
    }
}, [formData, selectedPlan]);

const handleLoadHistoryEntry = useCallback((entry: GuideHistoryEntry) => {
    setSelectedPlan(entry.planName);
    setFormData(entry.formData);
    setIsHistoryVisible(false);
    setToast({ message: `Guia de ${entry.patientName || 'paciente'} carregada do histórico.`, type: 'success' });
}, []);

const handleSaveFavorite = useCallback(() => {
  setIsSaveFavoriteModalVisible(true);
}, []);

const handleConfirmSaveFavorite = useCallback(async (favoriteName: string) => {
  setIsSaveFavoriteModalVisible(false);
  try {
      const newFavoriteEntry: FavoriteGuideEntry = {
          id: uuidv4(),
          savedAt: new Date().toISOString(),
          favoriteName,
          planName: selectedPlan,
          patientName: formData.nomeBeneficiario,
          formData: formData,
      };

      const currentFavorites = await loadData<FavoriteGuideEntry[]>('medicalGuidesFavorites') || [];
      const updatedFavorites = [newFavoriteEntry, ...currentFavorites].slice(0, 20); // Limita a 20
      await saveData('medicalGuidesFavorites', updatedFavorites);
      setFavorites(updatedFavorites);
      setToast({ message: `'${favoriteName}' foi salva nos favoritos!`, type: 'success' });

  } catch (error) {
      console.error("Falha ao salvar guia nos favoritos:", error);
      setToast({ message: 'Erro ao salvar a guia nos favoritos.', type: 'error' });
  }
}, [formData, selectedPlan]);

const handleLoadFavoriteEntry = useCallback((entry: FavoriteGuideEntry) => {
    setSelectedPlan(entry.planName);
    setFormData(entry.formData);
    setIsFavoritesVisible(false);
    setToast({ message: `Guia '${entry.favoriteName}' carregada dos favoritos.`, type: 'success' });
}, []);

const handleEditFavoriteEntry = useCallback((entry: FavoriteGuideEntry) => {
    setSelectedPlan(entry.planName);
    setFormData(entry.formData);
    setFillMode('detailed');
    setIsFavoritesVisible(false);
    setToast({ message: `Editando a guia favorita '${entry.favoriteName}'.`, type: 'success' });
}, []);

const handleDeleteFavoriteEntry = useCallback(async (id: string) => {
    try {
        const updatedFavorites = favorites.filter(fav => fav.id !== id);
        await saveData('medicalGuidesFavorites', updatedFavorites);
        setFavorites(updatedFavorites);
        setToast({ message: 'Guia removida dos favoritos.', type: 'success' });
    } catch (error) {
        console.error("Falha ao excluir favorito:", error);
        setToast({ message: 'Erro ao excluir a guia dos favoritos.', type: 'error' });
    }
}, [favorites]);

const executeExportFavorites = () => {
    try {
        const jsonString = JSON.stringify(favorites, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guias_favoritas_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToast({ message: 'Favoritos exportados com sucesso!', type: 'success' });
    } catch (err) {
        console.error("Falha ao exportar favoritos", err);
        setToast({ message: 'Ocorreu um erro ao exportar os favoritos.', type: 'error' });
    }
};

const handlePasswordSuccess = () => {
    setIsPasswordModalVisible(false);
    if (passwordModalAction === 'mapping') {
        setIsMappingEditorVisible(true);
    } else if (passwordModalAction === 'exportFavorites') {
        executeExportFavorites();
    }
    setPasswordModalAction(null);
};

const handleAddFavoriteProcedure = useCallback(async (procedure: Procedimento, tabela: string) => {
    if (!procedure.codigo || !procedure.descricao) {
        setToast({ message: 'Procedimento incompleto não pode ser favoritado.', type: 'error' });
        return;
    }

    const newFavorite: FavoriteProcedure = {
        id: uuidv4(),
        tabela: tabela,
        codigo: procedure.codigo,
        descricao: procedure.descricao,
    };

    const currentFavorites = await loadData<FavoriteProcedure[]>('favoriteProcedures') || [];
    const isDuplicate = currentFavorites.some(fav => fav.codigo === newFavorite.codigo && fav.tabela === newFavorite.tabela);

    if (isDuplicate) {
        setToast({ message: 'Este procedimento já está nos favoritos.', type: 'error' });
        return;
    }

    const updatedFavorites = [newFavorite, ...currentFavorites];
    await saveData('favoriteProcedures', updatedFavorites);
    setFavoriteProcedures(updatedFavorites);
    setToast({ message: 'Procedimento adicionado aos favoritos!', type: 'success' });
}, []);

const handleDeleteFavoriteProcedure = useCallback(async (procedureId: string) => {
    const currentFavorites = await loadData<FavoriteProcedure[]>('favoriteProcedures') || [];
    const updatedFavorites = currentFavorites.filter(fav => fav.id !== procedureId);
    await saveData('favoriteProcedures', updatedFavorites);
    setFavoriteProcedures(updatedFavorites);
}, []);

const handleAddFavoriteDiagnosis = useCallback(async (diagnosis: Diagnostico) => {
    if (!diagnosis.codigo || !diagnosis.descricao) {
        setToast({ message: 'Diagnóstico incompleto não pode ser favoritado.', type: 'error' });
        return;
    }

    const newFavorite: FavoriteDiagnosis = {
        id: uuidv4(),
        codigo: diagnosis.codigo,
        descricao: diagnosis.descricao,
    };

    const currentFavorites = await loadData<FavoriteDiagnosis[]>('favoriteDiagnoses') || [];
    const isDuplicate = currentFavorites.some(fav => fav.codigo === newFavorite.codigo);

    if (isDuplicate) {
        setToast({ message: 'Este diagnóstico já está nos favoritos.', type: 'error' });
        return;
    }

    const updatedFavorites = [newFavorite, ...currentFavorites];
    await saveData('favoriteDiagnoses', updatedFavorites);
    setFavoriteDiagnoses(updatedFavorites);
    setToast({ message: 'Diagnóstico adicionado aos favoritos!', type: 'success' });
}, []);

const handleDeleteFavoriteDiagnosis = useCallback(async (diagnosisId: string) => {
    const currentFavorites = await loadData<FavoriteDiagnosis[]>('favoriteDiagnoses') || [];
    const updatedFavorites = currentFavorites.filter(fav => fav.id !== diagnosisId);
    await saveData('favoriteDiagnoses', updatedFavorites);
    setFavoriteDiagnoses(updatedFavorites);
}, []);


  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8"><Spinner /> <p>Carregando dados e recursos...</p></div>;
    }
    if (error) {
      return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }
    
    const formArea = () => {
        if (!selectedPlan || !fillMode) {
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
            onGenerateAndSavePdf: handlePdfAction,
            onSaveFavorite: handleSaveFavorite,
            selectedPlan,
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
          opmKitsData,
          favoriteProcedures,
          favoriteDiagnoses,
          onAddFavoriteProcedure: handleAddFavoriteProcedure,
          onDeleteFavoriteProcedure: handleDeleteFavoriteProcedure,
          onAddFavoriteDiagnosis: handleAddFavoriteDiagnosis,
          onDeleteFavoriteDiagnosis: handleDeleteFavoriteDiagnosis,
          setToast,
          onGenerateAndSavePdf: handlePdfAction,
          onSaveFavorite: handleSaveFavorite,
          selectedPlan,
        };
        return <DetailedForm {...detailedFormProps} />;
    }

    return (
        <div className="space-y-8">
            <PlanSelector selectedPlan={selectedPlan} onPlanChange={handlePlanChange} />
             {selectedPlan && (
                <div className="text-right -mt-6 pr-4">
                    <button 
                        onClick={() => {
                            setPasswordModalAction('mapping');
                            setIsPasswordModalVisible(true);
                        }} 
                        className="text-sm text-secondary hover:underline"
                        aria-label="Gerenciar mapeamento dos campos do PDF"
                    >
                        Gerenciar Mapeamento
                    </button>
                </div>
            )}
            <InfoSections startExpanded={!selectedPlan} />
            {selectedPlan && <FillModeSelector fillMode={fillMode} onFillModeChange={handleFillModeChange} />}
            {selectedPlan && !fillMode && (
                <div className="p-6 bg-white shadow-md rounded-lg text-center text-gray-600 border border-gray-200">
                    <p className="text-lg">Selecione um modo de preenchimento acima para começar a preencher sua guia.</p>
                </div>
            )}
            {formArea()}
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onShowHistory={() => setIsHistoryVisible(true)} onShowFavorites={() => setIsFavoritesVisible(true)} />
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
      <FavoritesModal
        isOpen={isFavoritesVisible}
        onClose={() => setIsFavoritesVisible(false)}
        favorites={favorites}
        onLoad={handleLoadFavoriteEntry}
        onEdit={handleEditFavoriteEntry}
        onDelete={handleDeleteFavoriteEntry}
        onExport={() => {
            setPasswordModalAction('exportFavorites');
            setIsPasswordModalVisible(true);
        }}
      />
      <SaveFavoriteModal
        isOpen={isSaveFavoriteModalVisible}
        onClose={() => setIsSaveFavoriteModalVisible(false)}
        onSave={handleConfirmSaveFavorite}
        defaultName={formData.procedimentos[0]?.descricao || "Guia Favorita"}
      />
       <PasswordModal
          isOpen={isPasswordModalVisible}
          onClose={() => setIsPasswordModalVisible(false)}
          onSuccess={handlePasswordSuccess}
          setToast={setToast}
      />
      {isMappingEditorVisible && selectedPlan && (
          <MappingEditor 
              plan={selectedPlan}
              onClose={() => setIsMappingEditorVisible(false)}
              setToast={setToast}
          />
      )}
      <Footer />
    </div>
  );
};

export default App;