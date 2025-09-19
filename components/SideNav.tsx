import React from 'react';
import { NavSection } from '../types';

interface SideNavProps {
  sections: NavSection[];
  activeSection: string;
  completedSections: Record<string, boolean>;
  onNavClick: (key: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({ sections, activeSection, completedSections, onNavClick }) => {
  return (
    <nav className="sticky top-24 self-start w-64 flex-shrink-0 hidden md:block" aria-label="Navegação do Formulário">
      <ul className="space-y-2 border-l-2 border-gray-200">
        {sections.map(section => {
          const isActive = section.key === activeSection;
          const isComplete = completedSections[section.key];
          return (
            <li key={section.key}>
              <button
                onClick={() => onNavClick(section.key)}
                className={`w-full text-left pl-4 pr-3 py-2 transition-all duration-200 flex items-center gap-3 border-l-4 ${
                  isActive
                    ? 'border-secondary bg-light text-primary'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-primary'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isComplete ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Seção completa">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center" aria-label="Seção incompleta">
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                  </div>
                )}
                <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SideNav;
