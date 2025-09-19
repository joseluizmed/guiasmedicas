import { GenericFormData } from '../types';

/**
 * Maps the application's internal GenericFormData to a TISS field number format.
 * This creates a bridge between the form state and the metadata-driven PDF generator.
 * @param data The form data from the application state.
 * @returns An object with TISS field numbers as keys and corresponding form values.
 */
export const mapFormDataToTissFields = (data: GenericFormData): Record<string, string | number> => {
    const mappedData: Record<string, string | number> = {};

    // Helper to add data only if it's not null, undefined, or an empty string
    const add = (key: string, value: any) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
            mappedData[key] = value;
        }
    };

    // Mapping fields from GenericFormData to their TISS fieldNumber
    add('10nome', data.nomeBeneficiario);
    add('15nomedoprofissionalsolicitante', data.nomeProfissionalSolicitante);
    add('16conselhoprofissional', data.conselhoProfissional);
    add('17numeronoconselho', data.numeroConselho);
    add('18uf', data.ufConselho);
    add('21nomedoprestador', data.nomePrestador);
    add('25qtdediariassolicitadas', data.qtdeDiariasSolicitadas);
    add('26indicacaoclinica', data.indicacaoClinica);
    add('51observacao', data.observacaoJustificativa);
    add('52datadeemissao', data.dataEmissaoGuia);
    add('521datamedicosolicitante', data.dataSolicitacao);
    
    // Complex fields with logic
    add('27tipodedoenca', data.tipoDoenca); // A or C
    add('281tempodedoenca', data.tempoDoencaNumero);
    add('282dma', data.tempoDoencaUnidade); // D, M, A
    add('23tipodeinternacao', data.tipoInternacao);
    
    // Diagnoses (CID)
    data.diagnosticos?.forEach((diag, index) => {
        if (diag.codigo) {
            switch (index) {
                case 0: add('30cid10principal', diag.codigo); break;
                case 1: add('31cid102', diag.codigo); break;
                case 2: add('32cid103', diag.codigo); break;
                case 3: add('33cid104', diag.codigo); break;
            }
        }
    });

    // Procedures
    data.procedimentos?.forEach((proc, index) => {
        const i = index + 1;
        if (proc.codigo) add(`35${i}codigoprocedimento${i}`, proc.codigo);
        if (proc.descricao) add(`36${i}descricao${i}`, proc.descricao);
        if (proc.quantidade) add(`37${i}qtde${i}`, proc.quantidade);
    });

    // OPM
    data.opm?.forEach((opm, index) => {
        const i = index + 1;
        if (opm.descricao) add(`41${i}descricaoopm${i}`, opm.descricao);
        if (opm.quantidade) add(`42${i}qtdeopm${i}`, opm.quantidade);
    });


    return mappedData;
};
