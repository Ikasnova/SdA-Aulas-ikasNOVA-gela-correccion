import React, { useState } from 'react';
import { CriterionResult, Language } from '../types';
import StatusBadge from './StatusBadge';
import { translations } from '../utils/translations';

interface Props {
  result: CriterionResult;
  language: Language;
  forceExpand?: boolean;
}

const AuditResultCard: React.FC<Props> = ({ result, language, forceExpand = false }) => {
  const [expandedLocal, setExpandedLocal] = useState(false);
  const t = translations[language];

  // Determine if content should be visible (either user expanded, or global print force expand)
  const isExpanded = expandedLocal || forceExpand;

  // Colors from palette
  const colors = {
    dark: '#2C3E50',
    blue: '#277cd4',
    border: '#E8EFF4',
    bgHover: '#f8fafb',
    headerBg: '#f5f7fa'
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-md border mb-3 transition-all break-inside-avoid" style={{ borderColor: colors.border }}>
      <div 
        className="px-4 py-4 sm:px-6 cursor-pointer flex items-center justify-between hover:bg-[#f8fafb] transition-colors"
        onClick={() => setExpandedLocal(!expandedLocal)}
      >
        <div className="flex items-center space-x-4">
          <div 
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: colors.dark }}
          >
            {result.id}
          </div>
          <div>
            <h3 className="text-base font-bold uppercase tracking-wide" style={{ color: colors.dark }}>{result.name}</h3>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <StatusBadge status={result.status} language={language} />
          <svg 
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            style={{ color: colors.blue }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Use CSS display toggling + print:block to ensure it prints even if collapsed on screen */}
      <div 
        className={`border-t px-4 py-5 sm:p-6 bg-white ${isExpanded ? 'block' : 'hidden print:block'}`} 
        style={{ borderColor: colors.border }}
      >
        <p className="text-sm text-gray-600 mb-6 italic font-normal border-l-2 pl-3" style={{ borderColor: colors.blue }}>
          {result.observation}
        </p>
        
        {/* Detailed Check Table */}
        <div 
          className="border rounded-md mb-6 bg-white flex flex-col overflow-y-auto max-h-[400px] print:max-h-none print:overflow-visible" 
          style={{ borderColor: colors.border }}
        >
          <div className="flex-grow">
            <table className="min-w-full divide-y relative" style={{ divideColor: colors.border }}>
              <thead className="bg-[#f5f7fa] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-16 bg-[#f5f7fa]" style={{ color: colors.dark }}>{t.tableStatus}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider bg-[#f5f7fa]" style={{ color: colors.dark }}>{t.tableElement}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider bg-[#f5f7fa]" style={{ color: colors.dark }}>{t.tableDetail}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y" style={{ divideColor: colors.border }}>
                {result.items && result.items.length > 0 ? (
                  result.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafb] hover:bg-gray-50'}>
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">
                        {item.pass ? (
                          <svg className="h-5 w-5 text-[#3eb7ae] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-[#2C3E50] align-middle">
                        {item.label}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 align-middle font-mono">
                        {item.details}
                      </td>
                    </tr>
                  ))
                ) : (
                   <tr><td colSpan={3} className="px-4 py-4 text-sm text-gray-400 italic text-center">{t.emptyList}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {result.suggestions.length > 0 && (
          <div className="mt-4 bg-[#f5f7fa] p-4 rounded border" style={{ borderColor: colors.border }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.blue }}>{t.actions}</h4>
            <ul className="space-y-2">
              {result.suggestions.map((sug, idx) => (
                <li key={idx} className="flex items-start">
                  <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-[#6080a3]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditResultCard;