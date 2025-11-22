import React from 'react';
import { CriterionResult, EvaluationStatus, Language } from '../types';
import { rubricContent } from '../utils/rubricContent';
import { translations } from '../utils/translations';

interface Props {
  results: CriterionResult[];
  language: Language;
  isPrinting?: boolean;
  onUpdateChange?: (id: number, newStatus: EvaluationStatus) => void;
}

const RubricTable: React.FC<Props> = ({ results, language, isPrinting = false, onUpdateChange }) => {
  const content = rubricContent[language];
  const t = translations[language];

  // Helper to calculate score based on status
  const getScore = (status: EvaluationStatus): number => {
    switch (status) {
      case EvaluationStatus.PASS: return 2;
      case EvaluationStatus.WARNING: return 1;
      case EvaluationStatus.FAIL: return 0;
      default: return 0;
    }
  };

  // Calculate total score
  const totalScore = results.reduce((acc, curr) => acc + getScore(curr.status), 0);
  const maxScore = results.length * 2;

  const handleCellClick = (id: number, status: EvaluationStatus) => {
    if (isPrinting || !onUpdateChange) return;
    onUpdateChange(id, status);
  };

  return (
    // Removed break-inside-avoid from the container to allow table to split across pages
    <div className={`mt-10 mb-8 ${isPrinting ? '' : 'break-inside-avoid'}`}>
      <div className="flex items-center justify-between mb-4">
         <h3 className="text-xl font-bold uppercase tracking-wider text-[#2C3E50]">
           {t.rubricTitle}
         </h3>
         <div className="bg-[#2C3E50] text-white px-4 py-2 rounded shadow-sm print:border print:border-black print:text-black print:bg-transparent">
           <span className="text-sm font-light uppercase mr-2">{t.rubricTotal}:</span>
           <span className="text-xl font-bold">{totalScore} / {maxScore}</span>
         </div>
      </div>

      {/* Conditional styling: Remove overflow/shadow/border when printing to optimize PDF output */}
      <div className={`rounded-lg border-gray-200 ${isPrinting ? '' : 'overflow-x-auto shadow-sm border'}`}>
        <table className={`min-w-full divide-y divide-gray-200 ${isPrinting ? 'text-xs' : 'text-sm'}`}>
          <thead className="bg-gray-50 print:bg-gray-100">
            <tr>
              <th scope="col" className={`px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-1/4 ${isPrinting ? 'px-2 py-2' : ''}`}>
                {t.rubricCriterion}
              </th>
              <th scope="col" className={`px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider w-1/4 bg-red-50 print:bg-transparent ${isPrinting ? 'px-2 py-2' : ''}`}>
                0 {t.points}
              </th>
              <th scope="col" className={`px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider w-1/4 bg-yellow-50 print:bg-transparent ${isPrinting ? 'px-2 py-2' : ''}`}>
                1 {t.point}
              </th>
              <th scope="col" className={`px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider w-1/4 bg-green-50 print:bg-transparent ${isPrinting ? 'px-2 py-2' : ''}`}>
                2 {t.points}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {content.map((row, idx) => {
              // Find corresponding result by ID.
              // If IDs in Gemini response don't perfectly align (1-8), fallback to index.
              const result = results.find(r => r.id === row.id) || results[idx];
              const currentScore = result ? getScore(result.status) : 0;
              const id = result ? result.id : row.id;
              
              // Condensed padding for print
              const cellPadding = isPrinting ? 'px-2 py-2' : 'px-4 py-4';
              const firstColPadding = isPrinting ? 'px-2 py-2' : 'px-6 py-4';
              
              // Interactive classes
              const interactiveClass = (!isPrinting && onUpdateChange) ? 'cursor-pointer hover:opacity-80 transition-all' : '';

              return (
                <tr key={row.id}>
                  <td className={`${firstColPadding} text-gray-900 font-medium bg-gray-50 border-r border-gray-100 print:bg-gray-50`}>
                    {row.criterion}
                  </td>
                  
                  {/* 0 Points Cell (FAIL) */}
                  <td 
                    onClick={() => handleCellClick(id, EvaluationStatus.FAIL)}
                    className={`${cellPadding} text-center border-r border-gray-100 ${interactiveClass} hover:bg-red-50 ${currentScore === 0 ? 'bg-red-100 ring-inset ring-2 ring-red-500 font-bold text-red-900 print:bg-gray-200 print:border-2 print:border-black' : 'text-gray-500'}`}
                    title={!isPrinting ? "Click to mark as Failed (0 pts)" : ""}
                  >
                    {row.levels[0]}
                  </td>

                  {/* 1 Point Cell (WARNING) */}
                  <td 
                    onClick={() => handleCellClick(id, EvaluationStatus.WARNING)}
                    className={`${cellPadding} text-center border-r border-gray-100 ${interactiveClass} hover:bg-yellow-50 ${currentScore === 1 ? 'bg-yellow-100 ring-inset ring-2 ring-yellow-500 font-bold text-yellow-900 print:bg-gray-200 print:border-2 print:border-black' : 'text-gray-500'}`}
                    title={!isPrinting ? "Click to mark as Warning (1 pt)" : ""}
                  >
                    {row.levels[1]}
                  </td>

                  {/* 2 Points Cell (PASS) */}
                  <td 
                    onClick={() => handleCellClick(id, EvaluationStatus.PASS)}
                    className={`${cellPadding} text-center ${interactiveClass} hover:bg-green-50 ${currentScore === 2 ? 'bg-green-100 ring-inset ring-2 ring-green-500 font-bold text-green-900 print:bg-gray-200 print:border-2 print:border-black' : 'text-gray-500'}`}
                    title={!isPrinting ? "Click to mark as Passed (2 pts)" : ""}
                  >
                    {row.levels[2]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RubricTable;