export interface Procedimento {
  id: string;
  tabela: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  quantidadeAutorizada: number;
}

export interface OPM {
  id: string;
  tabela: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  fabricante: string;
  valorUnitario: number;
}

export interface Diagnostico {
  id: string;
  codigo: string;
  descricao: string;
}

export interface GenericFormData {
  // Seção 1: Cabeçalho
  registroANS: string;
  guiaNoPrestador: string;
  numeroGuiaAtribuidoOperadora: string;
  dataAutorizacao: string;
  senha: string;
  dataValidadeSenha: string;
  dataEmissaoGuia: string;

  // Seção 2: Dados do Beneficiário
  numeroCarteira: string;
  validadeCarteira: string;
  atendimentoRN: string;
  nomeBeneficiario: string;
  nomeSocial: string;
  numeroCartaoNacionalSaude: string; // Adicionado para Humana

  // Seção 3: Dados do Contratado Solicitante
  codigoOperadora: string;
  nomeContratado: string;
  nomeProfissionalSolicitante: string;
  conselhoProfissional: string;
  numeroConselho: string;
  ufConselho: string;
  codigoCBO: string;

  // Seção 4: Dados do Hospital/Local Solicitado/Dados da Internação
  codigoOperadoraCNPJ: string;
  nomePrestador: string; // Amil: (21) Nome do Prestador, Humana: (21) Nome do Prestador
  nomeHospitalSolicitado: string; // Bradesco: (20) Nome do Hospital/Local Solicitado
  dataSugeridaInternacao: string;
  caraterAtendimento: 'E' | 'U' | ''; // Renomeado de caraterInternacao
  tipoInternacao: '1' | '2' | '3' | '4' | '5' | '';
  regimeInternacao: '1' | '2' | '3' | ''; // Hospitalar, Hospital-dia, Domiciliar
  qtdeDiariasSolicitadas: number | string;
  previsaoUsoOPME: 'S' | 'N' | '';
  previsaoUsoQuimio: 'S' | 'N' | '';
  indicacaoClinica: string;
  
  // Seção 5: Hipótese Diagnóstica
  tipoDoenca: 'A' | 'C' | '';
  tempoDoencaNumero: number;
  tempoDoencaUnidade: 'A' | 'M' | 'D' | '';
  indicacaoAcidente: '0' | '1' | '2' | ''; // 0-Nenhum, 1-Trabalho, 2-Trânsito
  diagnosticos: Diagnostico[];

  // Seção 6: Procedimentos
  procedimentoTabela: string;
  procedimentos: Procedimento[];
  quickFillProcedure: string;

  // Seção 7: OPM (Órteses, Próteses e Materiais Especiais)
  opm: OPM[];

  // Seção 8: Dados da Autorização (preenchido pela Operadora, mas campos necessários)
  dataProvavelAdmissao: string;
  qtdeDiariasAutorizadas: number;
  tipoAcomodacaoAutorizada: string;
  codigoOperadoraCNPJAutorizado: string;
  nomeHospitalAutorizado: string;
  codigoCNES: string; // Também no cabeçalho de alguns
  codigoCNESAutorizado: string;
  observacaoJustificativa: string;

  // Seção 9: Finalização / Assinaturas
  dataSolicitacao: string; // No Bradesco é (46)
  assinaturaMedicoImage: string; // Base64
  assinaturaBeneficiarioImage: string; // Base64
  assinaturaResponsavelImage: string; // Base64
  dataAssinaturaResponsavelAutorizacao: string;
}

export interface Option {
  value: string;
  label: string;
}

export interface CidData {
  codigo: string;
  descricao: string;
}

export interface ProcedimentoData {
  codigo: string;
  descricao: string;
}

export interface SolicitanteData {
  id: string;
  nomeProfissionalSolicitante: string;
  conselhoProfissional: string;
  numeroConselho: string;
  ufConselho: string;
}

export interface PrestadorData {
    id: string;
    nome: string;
}

export interface QuickFillProcedureData extends GenericFormData {
  id: string;
  nomeComum: string;
}

export type PdfOutputAction = 'view' | 'print' | 'download';

export interface GuideHistoryEntry {
  id: string;
  generatedAt: string;
  planName: string;
  patientName: string;
  formData: GenericFormData;
}

export interface FavoriteGuideEntry {
  id: string;
  savedAt: string;
  favoriteName: string; // Custom name given by the user
  planName: string;
  patientName: string;
  formData: GenericFormData;
}

export interface FieldMetadata {
    key: string;
    pageIndex: number;
    x: number;
    y: number;
    label: string;
    width: number;
    height: number;
    fieldNumber: string;
    multiline?: boolean;
    font?: string;
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
}

export interface FavoriteProcedure {
  id: string;
  tabela: string;
  codigo: string;
  descricao: string;
}

export interface FavoriteDiagnosis {
  id: string;
  codigo: string;
  descricao: string;
}

export interface OpmKitItem {
  descricao: string;
  quantidade: number;
}

export interface OpmKit {
  procedimentoCodigo: string;
  procedimentoDescricao: string;
  opm: OpmKitItem[];
}

export interface OpmSupplier {
  fornecedor: string;
  kits: OpmKit[];
}

export interface NavSection {
  key: string;
  label: string;
}
