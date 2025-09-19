import React, { useState, useEffect } from 'react';

// FIX: Corrected component prop type definitions to resolve TypeScript errors.
interface InfoSectionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

const InfoSectionItem: React.FC<InfoSectionItemProps> = ({ title, children, isOpen, onClick }) => {
  return (
    <div className="border-b">
      <button
        onClick={onClick}
        className="w-full text-left py-4 px-6 flex justify-between items-center focus:outline-none hover:bg-light"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-primary">{title}</span>
        <svg
          className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-700 space-y-3 prose max-w-none">
          {children}
        </div>
      )}
    </div>
  );
};

interface InfoSectionsProps {
    startExpanded: boolean;
}

const InfoSections: React.FC<InfoSectionsProps> = ({ startExpanded }) => {
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    setIsExpanded(startExpanded);
    if (startExpanded) {
        setOpenSection('Sobre');
    } else {
        setOpenSection(null);
    }
  }, [startExpanded]);
  
  const handleToggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  const contactEmail = 'joseluizmed@gmail.com';
  const emailSubject = 'Sobre o Aplicativo Gerador de Guias Médicas';

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left py-4 px-6 flex justify-between items-center focus:outline-none bg-primary text-white hover:bg-secondary transition-colors"
            aria-expanded={isExpanded}
        >
            <span className="text-xl font-bold">Informações e Ajuda</span>
            <svg
            className={`w-6 h-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>
      {isExpanded && (
        <div>
            <InfoSectionItem
                title="Sobre"
                isOpen={openSection === 'Sobre'}
                onClick={() => handleToggleSection('Sobre')}
            >
                <p><strong>Bem-vindo ao Gerador de Guias Médicas!</strong></p>
                <p>
                O preenchimento adequado de guias é um pilar para a eficiência e o bom funcionamento dos serviços de saúde. Erros ou atrasos podem impactar diretamente o atendimento ao paciente e a gestão dos recursos. Este aplicativo foi criado para simplificar e otimizar esse processo.
                </p>
                <p>
                Idealizado pelo <strong>Dr. José Luiz de Souza Neto (CRM/RN 4271)</strong>, Cirurgião, Mestre em Ensino da Saúde e Professor do Curso de Medicina da UFRN, este projeto nasceu de uma busca incessante por inovação. Autor de livros, patentes e programas na área da saúde, ele percebeu a necessidade de uma solução que trouxesse mais celeridade e segurança ao preenchimento de guias médicas.
                </p>
                <p>
                Com este programa, você pode preencher uma guia completa, exportá-la como um arquivo JSON e, posteriormente, utilizar esses arquivos para agilizar preenchimentos futuros através do modo de "Preenchimento Rápido". A geração de PDFs padronizados com apenas um clique economiza tempo e reduz a chance de erros.
                </p>
                <p>
                Incentivamos você a explorar as funcionalidades. Caso tenha dúvidas ou sugestões, não hesite em nos contatar através do link na seção "Contato".
                </p>
            </InfoSectionItem>

            <InfoSectionItem
                title="Instruções"
                isOpen={openSection === 'Instruções'}
                onClick={() => handleToggleSection('Instruções')}
            >
                <h4 className="font-bold text-md text-secondary">Visão Geral</h4>
                <p>
                O aplicativo foi projetado para ser intuitivo. O fluxo principal consiste em selecionar o plano de saúde, escolher um modo de preenchimento e preencher os dados para gerar um PDF.
                </p>
                <h4 className="font-bold text-md text-secondary mt-2">Modos de Preenchimento</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Preenchimento Detalhado:</strong> Use este modo para preencher todos os campos da guia. É o modo mais completo, ideal para novos procedimentos ou pacientes. Após o preenchimento, você pode usar o botão "Exportar Guia" para salvar um modelo em formato JSON.</li>
                  <li><strong>Preenchimento Rápido:</strong> Use este modo para carregar rapidamente modelos pré-configurados. Estes modelos são baseados nos arquivos JSON que você exportou ou que foram integrados ao programa.</li>
                </ul>
                <h4 className="font-bold text-md text-secondary mt-4">Funções dos Botões</h4>
                <div className="space-y-4 not-prose">
                     <div className="flex items-center gap-4 p-2 rounded-md bg-gray-50">
                        <div className="px-4 py-2 bg-accent text-primary font-bold rounded-lg shadow-md flex items-center text-sm flex-shrink-0">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                           </svg>
                           <span>Salvar Favorito</span>
                        </div>
                        <p className="text-sm text-gray-800"><strong>Salvar Favorito:</strong> Salva a guia atual com os dados preenchidos em uma lista interna. Você pode acessar, carregar ou editar guias salvas através do botão "Favoritos" no cabeçalho. É ideal para guias que você usa com frequência.</p>
                     </div>
                     <div className="flex items-center gap-4 p-2 rounded-md bg-gray-50">
                        <div title="Ver Guia" className="p-3 bg-gray-500 text-white rounded-lg shadow-md flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.27 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-800">
                            <strong>Ver Guia:</strong> Abre uma pré-visualização da guia em PDF em uma nova aba do navegador, sem iniciar a impressão ou o download.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 p-2 rounded-md bg-gray-50">
                        <div title="Salvar PDF" className="p-3 bg-blue-500 text-white rounded-lg shadow-md flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-800">
                            <strong>Salvar PDF:</strong> Inicia o download da guia preenchida como um arquivo PDF para o seu computador.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 p-2 rounded-md bg-gray-50">
                        <div className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg flex items-center text-sm flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                            </svg>
                            <span>Imprimir Guia</span>
                        </div>
                        <p className="text-sm text-gray-800">
                            <strong>Imprimir Guia:</strong> Abre a guia em PDF em uma nova aba e aciona a caixa de diálogo de impressão do seu navegador.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 p-2 rounded-md bg-gray-50">
                        <div className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md flex items-center text-sm flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span>Exportar Guia</span>
                        </div>
                        <p className="text-sm text-gray-800"><strong>Exportar Guia (Avançado):</strong> Salva os dados da guia (procedimentos, CID, etc.) em um arquivo JSON no seu computador. Este arquivo pode ser usado por desenvolvedores para criar novos modelos de preenchimento rápido.</p>
                    </div>
                </div>
            </InfoSectionItem>

            <InfoSectionItem
                title="Política de Privacidade"
                isOpen={openSection === 'Política de Privacidade'}
                onClick={() => handleToggleSection('Política de Privacidade')}
            >
                <p>
                A sua privacidade e a segurança dos dados são nossa maior prioridade. Este aplicativo foi desenvolvido em conformidade com os princípios da Lei Geral de Proteção de Dados (LGPD).
                </p>
                <p>
                <strong>Todos os dados inseridos no formulário são armazenados exclusivamente no seu próprio dispositivo (navegador)</strong>. Nenhuma informação é enviada, compartilhada ou armazenada em servidores externos. O controle dos dados é inteiramente seu. Ao limpar o cache do seu navegador, todos os dados salvos pelo aplicativo serão removidos permanentemente.
                </p>
            </InfoSectionItem>

            <InfoSectionItem
                title="Contato"
                isOpen={openSection === 'Contato'}
                onClick={() => handleToggleSection('Contato')}
            >
                <p>
                Tem dúvidas, sugestões ou encontrou algum problema? Seu feedback é muito importante para nós!
                </p>
                <p>
                Clique no botão abaixo para abrir seu cliente de e-mail padrão e nos enviar uma mensagem.
                </p>
                <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(emailSubject)}`}
                className="mt-2 inline-block px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-secondary transition-colors"
                >
                Enviar E-mail
                </a>
            </InfoSectionItem>
            </div>
      )}
    </div>
  );
};

export default InfoSections;