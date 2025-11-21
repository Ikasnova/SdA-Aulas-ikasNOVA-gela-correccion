import React from 'react';
import { EvaluationStatus, Language } from '../types';
import { translations } from '../utils/translations';

interface StatusBadgeProps {
  status: EvaluationStatus;
  language: Language;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, language }) => {
  const t = translations[language];

  switch (status) {
    case EvaluationStatus.PASS:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
          {t.statusPass}
        </span>
      );
    case EvaluationStatus.WARNING:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <svg className="mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
          {t.statusWarn}
        </span>
      );
    case EvaluationStatus.FAIL:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
          {t.statusFail}
        </span>
      );
    default:
      return null;
  }
};

export default StatusBadge;