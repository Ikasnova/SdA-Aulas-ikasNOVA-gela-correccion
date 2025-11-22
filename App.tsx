import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import AuditResultCard from './components/AuditResultCard';
import RubricTable from './components/RubricTable';
import { parseElpFile } from './utils/elpParser';
import { auditContent } from './services/geminiService';
import { AuditReport, UploadState, Language, EvaluationStatus } from './types';
import { translations } from './utils/translations';

function App() {
  const [language, setLanguage] = useState<Language | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [appState, setAppState] = useState<UploadState>({
    isUploading: false,
    isProcessing: false,
    progress: 0,
    error: null,
  });
  const [isPrinting, setPrinting] = useState(false);

  // Official Palette Colors
  const colors = {
    dark: '#2C3E50',    // Anthracite
    blueGrey: '#6080a3',
    turquoise: '#3eb7ae',
    brightBlue: '#277cd4',
    bg: '#f5f7fa'
  };

  const handleFileProcessing = async (file: File) => {
    if (!language) return;

    setAppState({ isUploading: true, isProcessing: true, progress: 10, error: null });
    setAuditReport(null);

    try {
      // 1. Extract XML from .elp
      setAppState(prev => ({ ...prev, progress: 30 }));
      const xmlContent = await parseElpFile(file);
      
      // 2. Send to Gemini
      setAppState(prev => ({ ...prev, progress: 60 }));
      const report = await auditContent(file.name, xmlContent, language);
      
      setAuditReport(report);
      setAppState({ isUploading: false, isProcessing: false, progress: 100, error: null });

    } catch (err: any) {
      console.error(err);
      setAppState({ 
        isUploading: false, 
        isProcessing: false, 
        progress: 0, 
        error: err.message || "Error desconocido al procesar el archivo." 
      });
    }
  };

  // Handle manual rubric override by user
  const handleRubricChange = (id: number, newStatus: EvaluationStatus) => {
    if (!auditReport) return;

    // 1. Update the specific criterion status
    const updatedCriteria = auditReport.criteriaResults.map((c) => {
      if (c.id === id) {
        return { ...c, status: newStatus };
      }
      return c;
    });

    // 2. Recalculate Overall Score based on new rubric values
    // Logic: 8 criteria * 2 points max = 16 points total.
    // Score = (TotalPoints / 16) * 100
    const totalPoints = updatedCriteria.reduce((acc, curr) => {
      if (curr.status === EvaluationStatus.PASS) return acc + 2;
      if (curr.status === EvaluationStatus.WARNING) return acc + 1;
      return acc;
    }, 0);
    
    const maxPoints = updatedCriteria.length * 2 || 16;
    const newOverallScore = Math.round((totalPoints / maxPoints) * 100);

    setAuditReport({
      ...auditReport,
      criteriaResults: updatedCriteria,
      overallScore: newOverallScore
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#3eb7ae'; // Turquoise for high score
    if (score >= 50) return '#277cd4'; // Blue for medium
    return '#e74c3c'; // Standard red for fail (accessibility)
  };

  const downloadCSV = () => {
    if (!auditReport || !language) return;
    
    const headers = [
      'ID',
      'Criterio',
      'Puntuación',
      'Estado',
      'Observación',
      'Elemento',
      'Cumple',
      'Detalle'
    ];

    const rows = [headers.join(',')];

    auditReport.criteriaResults.forEach(res => {
      if (res.items && res.items.length > 0) {
        res.items.forEach(item => {
          const line = [
            res.id,
            `"${res.name.replace(/"/g, '""')}"`,
            auditReport.overallScore,
            res.status,
            `"${res.observation.replace(/"/g, '""')}"`,
            `"${item.label.replace(/"/g, '""')}"`,
            item.pass ? 'SÍ' : 'NO',
            `"${item.details.replace(/"/g, '""')}"`
          ];
          rows.push(line.join(','));
        });
      } else {
         const line = [
            res.id,
            `"${res.name.replace(/"/g, '""')}"`,
            auditReport.overallScore,
            res.status,
            `"${res.observation.replace(/"/g, '""')}"`,
            '-',
            '-',
            '-'
          ];
          rows.push(line.join(','));
      }
    });

    const csvContent = "\uFEFF" + rows.join('\n'); // Add BOM for correct Excel display
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_${auditReport.analyzedFileName.replace(/\.[^/.]+$/, "")}_${language}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePDF = async () => {
    if (!auditReport) return;
    
    setPrinting(true); // Triggers re-render to show simplified PDF view
    
    // Wait a tick for React to render the simplified view (headers + rubric only)
    setTimeout(async () => {
      const element = document.getElementById('report-content');
      if (!element) {
        setPrinting(false);
        return;
      }

      const opt = {
        margin: [10, 10, 10, 10], // Top, Left, Bottom, Right
        filename: `Informe_Auditoria_${auditReport.analyzedFileName.replace(/\.[^/.]+$/, "")}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // Changed mode to allow breaking large tables across pages
        pagebreak: { mode: ['css', 'legacy'] }
      };

      try {
        const html2pdf = (window as any).html2pdf;
        if (html2pdf) {
          await html2pdf().set(opt).from(element).save();
        } else {
          alert("Librería PDF no cargada. Use la opción de imprimir del navegador (Ctrl+P).");
        }
      } catch (error) {
        console.error("PDF Generation Error", error);
        alert("Error al generar PDF. Intente imprimir (Ctrl+P).");
      } finally {
        setPrinting(false); // Restore full view
      }
    }, 1000);
  };

  // Language Selection Screen
  if (!language) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-md w-full px-6 text-center">
           <div className="h-16 w-16 bg-white rounded shadow-sm flex items-center justify-center mx-auto mb-8">
              <svg className="h-10 w-10" style={{ color: colors.dark }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
           </div>
           <h1 className="text-2xl font-bold mb-8" style={{ color: colors.dark }}>Selecciona el idioma / Hizkuntza aukeratu</h1>
           <div className="grid grid-cols-1 gap-4">
             <button 
              onClick={() => setLanguage('es')}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-105 shadow-md"
              style={{ backgroundColor: colors.dark }}
             >
                Castellano
             </button>
             <button 
              onClick={() => setLanguage('eu')}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-105 shadow-md"
              style={{ backgroundColor: colors.turquoise }}
             >
                Euskara
             </button>
           </div>
           <p className="mt-10 text-xs text-gray-400 uppercase tracking-widest">ikasNOVA gela 25/26</p>
        </div>
      </div>
    );
  }

  const t = translations[language];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      {/* Header - Hidden during PDF generation/Print */}
      <header className={`shadow-md border-b border-[#1a1a1a]/10 ${isPrinting ? 'hidden' : 'block'}`} style={{ backgroundColor: colors.dark }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Stylized Icon */}
              <div className="h-10 w-10 bg-white rounded flex items-center justify-center mr-4">
                 <svg className="h-6 w-6" style={{ color: colors.dark }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{t.title}</h1>
                <p className="text-[#E8EFF4] text-sm font-light tracking-wide">{t.subtitle}</p>
              </div>
            </div>
            <div className="hidden sm:block">
               <button onClick={() => setLanguage(null)} className="text-xs font-medium text-gray-300 hover:text-white underline">
                  {language === 'es' ? 'Cambiar Idioma' : 'Hizkuntza Aldatu'}
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Upload Section - Hidden when printing */}
        <div className={`bg-white rounded-lg shadow-sm border p-8 mb-8 no-print ${isPrinting ? 'hidden' : 'block'}`} style={{ borderColor: '#E8EFF4' }}>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold uppercase tracking-wide" style={{ color: colors.dark }}>{t.auditTitle}</h2>
            <p className="text-sm text-gray-500 mt-2">{t.auditDesc}</p>
          </div>
          
          <FileUploader 
            onFileSelected={handleFileProcessing} 
            disabled={appState.isProcessing} 
            language={language}
          />

          {appState.isProcessing && (
            <div className="mt-8 max-w-xl mx-auto">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.blueGrey }}>{t.processing}</span>
                <span className="text-xs font-bold" style={{ color: colors.blueGrey }}>{appState.progress}%</span>
              </div>
              <div className="w-full bg-[#E8EFF4] rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${appState.progress}%`, backgroundColor: colors.turquoise }}
                ></div>
              </div>
            </div>
          )}

          {appState.error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold mr-1">{t.error}:</strong>
              <span className="block sm:inline">{appState.error}</span>
            </div>
          )}
        </div>

        {/* Results Section */}
        {auditReport && (
          <div className="animate-fade-in-up space-y-8">
            
            {/* REPORT CONTENT WRAPPER */}
            <div id="report-content" className="space-y-8 bg-white p-4 sm:p-0">
              
              {/* --- PDF SPECIFIC HEADER (Visible only when printing) --- */}
              {isPrinting && (
                <div className="mb-8 border-b-2 pb-6 text-center" style={{ borderColor: colors.dark }}>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{t.reportTitle}</h1>
                  
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-left">
                    <div className="mb-4">
                       <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">SdA / Fichero:</span>
                       <span className="text-xl font-semibold text-gray-800">{auditReport.analyzedFileName}</span>
                    </div>
                    <div>
                       <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">{t.summary} / Nivel:</span>
                       <p className="text-gray-700 text-base leading-relaxed">{auditReport.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* --- SCREEN ONLY DASHBOARD (Hidden when printing) --- */}
              {!isPrinting && (
                <>
                  {/* Overall Score Card */}
                  <div className="bg-white rounded-lg shadow-sm border p-8 flex flex-col md:flex-row items-center justify-between break-inside-avoid" style={{ borderColor: '#E8EFF4' }}>
                    <div className="flex-1 pr-8">
                      <div className="flex items-center mb-3">
                         <h2 className="text-2xl font-bold" style={{ color: colors.dark }}>{t.reportTitle}</h2>
                         <span className="ml-3 px-2 py-1 bg-[#E8EFF4] text-xs font-mono text-gray-600 rounded">{auditReport.analyzedFileName}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed border-l-4 pl-4 py-1" style={{ borderColor: colors.blueGrey }}>
                        {auditReport.summary}
                      </p>
                    </div>
                    <div className="mt-6 md:mt-0 text-center">
                      <div 
                        className="text-6xl font-bold tracking-tighter"
                        style={{ color: getScoreColor(auditReport.overallScore) }}
                      >
                        {auditReport.overallScore}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2 block">{t.score}</span>
                    </div>
                  </div>

                  {/* Detailed Criteria List */}
                  <div>
                    <div className="flex items-center mb-4 border-b pb-2" style={{ borderColor: '#E8EFF4' }}>
                       <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: colors.blueGrey }}>{t.breakdown}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-0">
                      {auditReport.criteriaResults.map((result) => (
                        <AuditResultCard 
                          key={result.id} 
                          result={result} 
                          language={language} 
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* --- RUBRIC (Always Visible, Now Interactive) --- */}
              <RubricTable 
                results={auditReport.criteriaResults} 
                language={language} 
                isPrinting={isPrinting}
                onUpdateChange={handleRubricChange}
              />
            </div>

            {/* Actions - Hidden when printing */}
            <div className={`flex justify-center pt-8 pb-12 gap-4 no-print ${isPrinting ? 'hidden' : 'flex'}`}>
               <button 
                onClick={downloadCSV}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-bold uppercase tracking-wider rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
              >
                <svg className="mr-2 -ml-1 h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.exportCSV}
              </button>

              <button 
                onClick={handleGeneratePDF}
                disabled={isPrinting}
                className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-bold uppercase tracking-wider rounded shadow-sm text-white focus:outline-none hover:shadow-lg transition-shadow disabled:opacity-70 disabled:cursor-wait"
                style={{ backgroundColor: colors.dark }}
              >
                {isPrinting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                )}
                {t.print}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;