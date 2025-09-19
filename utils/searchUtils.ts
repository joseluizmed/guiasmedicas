import { CidData, ProcedimentoData, SolicitanteData, PrestadorData, QuickFillProcedureData, FavoriteProcedure, FavoriteDiagnosis } from '../types';

/**
 * Normalizes a string by converting to lowercase and removing accents/diacritics.
 * This allows for case-insensitive and accent-insensitive searching.
 * @param str The string to normalize.
 * @returns The normalized string.
 */
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

/**
 * A generic filter function for autocomplete data sources that have 'codigo' (code) and 'descricao' (description).
 * It performs a case-insensitive and accent-insensitive search.
 * It matches if the code *contains* the query OR if the description *contains* the query.
 * The search is triggered only when the query has 2 or more characters.
 * @param item The data item (e.g., CidData or ProcedimentoData).
 * @param query The search query string.
 * @returns True if the item matches the query, false otherwise.
 */
export const codeDescriptionFilter = (
  item: CidData | ProcedimentoData,
  query: string
): boolean => {
  if (!query) return false;
  const normalizedQuery = normalizeString(query);

  const normalizedDesc = normalizeString(item.descricao);
  const normalizedCode = normalizeString(item.codigo);

  // Check if the code or description includes the query
  return normalizedCode.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery);
};

/**
 * A specific filter function for TUSS/CBHPM procedures.
 * It performs a case-insensitive and accent-insensitive search.
 * It matches if the code *starts with* the query OR if the description *contains* the query.
 * This provides a more precise search for users who know the beginning of a procedure code.
 * @param item The procedure data item.
 * @param query The search query string.
 * @returns True if the item matches the query, false otherwise.
 */
export const procedureSearchFilter = (
  item: ProcedimentoData,
  query: string
): boolean => {
  if (!query) return false;
  const normalizedQuery = normalizeString(query);

  const normalizedDesc = normalizeString(item.descricao);
  const normalizedCode = normalizeString(item.codigo);

  // Check if the code starts with the query OR description includes the query
  return normalizedCode.startsWith(normalizedQuery) || normalizedDesc.includes(normalizedQuery);
};

/**
 * A specific filter function for SolicitanteData.
 * It performs a case-insensitive and accent-insensitive search on the surgeon's name.
 * It matches if the name contains the query.
 * @param item The solicitante data item.
 * @param query The search query string.
 * @returns True if the item matches the query, false otherwise.
 */
export const solicitanteSearchFilter = (
  item: SolicitanteData,
  query: string
): boolean => {
  if (!query) return false;
  const normalizedQuery = normalizeString(query);

  const normalizedName = normalizeString(item.nomeProfissionalSolicitante);
  
  return normalizedName.includes(normalizedQuery);
};

/**
 * A specific filter function for PrestadorData.
 * It performs a case-insensitive and accent-insensitive search on the provider's name.
 * It matches if the name contains the query.
 * @param item The provider data item.
 * @param query The search query string.
 * @returns True if the item matches the query, false otherwise.
 */
export const prestadorSearchFilter = (
  item: PrestadorData,
  query: string
): boolean => {
  if (!query) return false;
  const normalizedQuery = normalizeString(query);

  const normalizedName = normalizeString(item.nome);
  
  return normalizedName.includes(normalizedQuery);
};

export const quickFillProcedureSearchFilter = (
  item: QuickFillProcedureData,
  query: string
): boolean => {
  if (!query) return false;
  const normalizedQuery = normalizeString(query);
  const normalizedName = normalizeString(item.nomeComum);
  return normalizedName.includes(normalizedQuery);
};

export const favoriteProcedureSearchFilter = (
  item: FavoriteProcedure,
  query: string
): boolean => {
  if (!query) return false;
  const normalizedQuery = normalizeString(query);

  const normalizedDesc = normalizeString(item.descricao);
  const normalizedCode = normalizeString(item.codigo);

  // Check if the code or description includes the query
  return normalizedCode.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery);
};

export const favoriteDiagnosisSearchFilter = (
  item: FavoriteDiagnosis,
  query: string
): boolean => {
  if (!query) return false;
  const normalizedQuery = normalizeString(query);

  const normalizedDesc = normalizeString(item.descricao);
  const normalizedCode = normalizeString(item.codigo);

  // Check if the code or description includes the query
  return normalizedCode.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery);
};