import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport, Language } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key no configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

const PROMPTS = {
  es: `
    ROL: Auditor experto, riguroso y exhaustivo en normativa educativa de la Comunidad Foral de Navarra y calidad de Recursos Educativos Abiertos (REA).
    TAREA: Analizar el contenido XML de un archivo eXeLearning y generar un informe de validación técnica y pedagógica.

    PRINCIPIOS DE AUDITORÍA (CRÍTICOS):
    1. DETERMINISMO: Tu análisis debe ser consistente. Ante la misma entrada, el resultado debe ser idéntico.
    2. RIGOR: Sé estricto. Ante la duda o falta de evidencia, penaliza (WARNING o FAIL). No asumas cumplimiento si no está explícito.
    3. EVIDENCIA: Basa cada juicio en el texto extraído. Cita literalmente si es necesario en 'details'.

    NORMATIVA EDUCATIVA DE NAVARRA (REFERENCIA OBLIGATORIA):
    Debes verificar que la normativa citada en el texto coincida con la etapa educativa detectada:
    - Educación Infantil: Decreto Foral 61/2022
    - Educación Primaria: Decreto Foral 67/2022
    - Educación Secundaria Obligatoria (ESO): Decreto Foral 71/2022
    - Bachillerato: Decreto Foral 72/2022
    * Si el texto es de una etapa (ej: Primaria) pero cita el decreto de otra (ej: 71/2022), el estado debe ser WARNING o FAIL en el criterio 1.

    RÚBRICA DE CALIFICACIÓN (MAPEO ESTRICTO):
    Usa esta lógica para asignar el 'status' de cada criterio.
    
    CRITERIO 1: Ajuste al currículum de Navarra
    - FAIL (Nivel 0): No cita currículo de Navarra o cita normativa derogada/antigua.
    - WARNING (Nivel 1): Cita normativa de Navarra pero es incorrecta para la etapa detectada o es muy vaga.
    - PASS (Nivel 2): Cita explícitamente el Decreto Foral VIGENTE correcto para la etapa.

    CRITERIO 2: Realización de cambios exigidos
    - FAIL (Nivel 0): Estructura inexistente o contenido simulado ("lorem ipsum").
    - WARNING (Nivel 1): Faltan secciones clave (Introducción, Desarrollo o Evaluación).
    - PASS (Nivel 2): Estructura completa y contenido real desarrollado.

    CRITERIO 3: Redacción
    - FAIL (Nivel 0): Errores gramaticales graves, incoherente o tono inadecuado.
    - WARNING (Nivel 1): Comprensible pero con errores de estilo.
    - PASS (Nivel 2): Clara, precisa y adaptada al alumnado.

    CRITERIO 4: Lenguaje no discriminatorio
    - FAIL (Nivel 0): Uso explícito de masculino genérico excluyente o estereotipos.
    - WARNING (Nivel 1): Uso mixto o descuidos puntuales.
    - PASS (Nivel 2): Uso consistente de lenguaje inclusivo (alumnado, profesorado, etc.).

    CRITERIO 5: Ortografía
    - FAIL (Nivel 0): Múltiples errores ortográficos.
    - WARNING (Nivel 1): 1-3 errores menores.
    - PASS (Nivel 2): 0 errores.

    CRITERIO 6: Licencias abiertas (ANÁLISIS EXHAUSTIVO ITEM A ITEM)
    - FAIL (Nivel 0): Recursos con Copyright, "Todos los derechos reservados" o sin licencia indicada.
    - WARNING (Nivel 1): Licencias abiertas indicadas pero incompletas (falta autor) o genéricas para todo el archivo sin especificar en imágenes.
    - PASS (Nivel 2): CADA imagen/recurso tiene su licencia CC (BY, BY-SA) explícita y correcta.

    CRITERIO 7: Citas y créditos
    - FAIL (Nivel 0): Uso de textos/recursos externos sin citar.
    - WARNING (Nivel 1): Citas incompletas.
    - PASS (Nivel 2): Atribución completa de fuentes.

    CRITERIO 8: Enlaces (ANÁLISIS TÉCNICO DE CÓDIGO)
    - FAIL (Nivel 0): Enlaces rotos o vacíos (href="" o #).
    - WARNING (Nivel 1): Enlaces que abren en la misma pestaña (faltan target="_blank").
    - PASS (Nivel 2): TODOS los enlaces externos tienen target="_blank".

    INSTRUCCIONES DE SALIDA:
    - Genera un JSON válido.
    - Para los criterios 6, 7 y 8, el array 'items' debe contener TODOS los elementos encontrados (todas las imágenes, todos los enlaces). NO resumas.
  `,
  eu: `
    ROLA: Nafarroako Foru Komunitateko hezkuntza-araudian eta Baliabide Irekien (REA) kalitatean aditua den auditore zorrotza.
    ZEREGINA: eXeLearning fitxategi baten XML edukia aztertu eta baliozkotze-txosten tekniko eta pedagogikoa sortu.

    AUDITORIA-PRINTZIPIOAK (KRITIKOAK):
    1. DETERMINISMOA: Emaitza berdina izan behar da beti sarrera berdinarekin.
    2. ZORROZTASUNA: Zalantzarik bada, zigortu (WARNING edo FAIL).
    3. EBIDENTZIA: Epai bakoitza testuan oinarritu.

    NAFARROAKO HEZKUNTZA ARAUDIA (DERRIGORREZKO ERREFERENTZIA):
    Egiaztatu aipatutako araudia detektatutako etapari dagokiola:
    - Haur Hezkuntza: 61/2022 Foru Dekretua
    - Lehen Hezkuntza: 67/2022 Foru Dekretua
    - DBH (ESO): 71/2022 Foru Dekretua
    - Batxilergoa: 72/2022 Foru Dekretua
    * Testua etapa batekoa bada baina beste baten dekretua aipatzen badu, 1. irizpidea FAIL edo WARNING izan behar da.

    KALIFIKAZIO-ERRUBRIKA (MAPEO ZORROTZA):
    
    1. IRIZPIDEA: Nafarroako curriculumarekiko egokitzapena
    - FAIL (0 Maila): Ez da Nafarroako curriculuma aipatzen edo indargabetutakoa aipatzen da.
    - WARNING (1 Maila): Okerreko etapa aipatzen da edo oso lausoa da.
    - PASS (2 Maila): Etapari dagokion INDARREKO Foru Dekretua aipatzen da esplizituki.

    2. IRIZPIDEA: Eskatutako aldaketak
    - FAIL (0 Maila): Egiturarik ez edo "lorem ipsum".
    - WARNING (1 Maila): Atal garrantzitsuak falta dira.
    - PASS (2 Maila): Egitura osoa eta benetako edukia.

    3. IRIZPIDEA: Idazkera
    - FAIL (0 Maila): Akats larriak edo tonu desegokia.
    - WARNING (1 Maila): Ulergarria baina hobetzekoa.
    - PASS (2 Maila): Argia, zehatza eta ikasleari egokitua.

    4. IRIZPIDEA: Hizkera ez-diskriminatzailea
    - FAIL (0 Maila): Hizkera baztertzailea.
    - WARNING (1 Maila): Akats puntualak.
    - PASS (2 Maila): Hizkera inklusiboaren erabilera sendoa.

    5. IRIZPIDEA: Ortografia
    - FAIL (0 Maila): Akats asko.
    - WARNING (1 Maila): 1-3 akats txiki.
    - PASS (2 Maila): 0 akats.

    6. IRIZPIDEA: Lizentzia irekiak (AZTERKETA SAKONA ELEMENTUZ ELEMENTU)
    - FAIL (0 Maila): Copyright edo lizentziarik gabe.
    - WARNING (1 Maila): Lizentzia irekiak baina osatugabeak.
    - PASS (2 Maila): Irudi/baliabide BAKOITZAK CC lizentzia zuzena du.

    7. IRIZPIDEA: Aipamenak
    - FAIL (0 Maila): Aipamenik ez.
    - WARNING (1 Maila): Aipamen osatugabeak.
    - PASS (2 Maila): Iturrien aipamen zuzena.

    8. IRIZPIDEA: Estekak (KODEAREN AZTERKETA TEKNIKOA)
    - FAIL (0 Maila): Esteka hautsiak edo hutsak.
    - WARNING (1 Maila): Leiho berean irekitzen dira (ez dute target="_blank").
    - PASS (2 Maila): Kanpo-esteka GUZTIEK target="_blank" dute.
  `
};

export const auditContent = async (fileName: string, xmlContent: string, language: Language): Promise<AuditReport> => {
  const ai = getClient();
  // Using preview model for complex reasoning and exhaustive analysis
  const modelId = "gemini-3-pro-preview";

  const promptText = PROMPTS[language];

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: promptText },
          { text: `--- INICIO/HASIERA CONTENIDO XML (eXeLearning) ---\n${xmlContent.substring(0, 1500000)}\n--- FIN/AMAIERA CONTENIDO XML ---` }
        ]
      },
      config: {
        temperature: 0, // FORCE DETERMINISTIC OUTPUT
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "Puntuación/Puntuazioa (0-100) calculada basada en la suma de niveles de rúbrica (0, 1, 2)." },
            summary: { type: Type.STRING, description: "Resumen ejecutivo incluyendo la etapa educativa detectada y decreto aplicado." },
            criteriaResults: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  name: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["PASS", "WARNING", "FAIL"] },
                  observation: { type: Type.STRING, description: "Justificación estricta basada en la rúbrica." },
                  items: {
                    type: Type.ARRAY,
                    description: "Lista exhaustiva de evidencias (imágenes, enlaces, citas).",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        pass: { type: Type.BOOLEAN },
                        details: { type: Type.STRING }
                      },
                      required: ["label", "pass", "details"]
                    }
                  },
                  suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "name", "status", "observation", "suggestions", "items"]
              }
            }
          },
          required: ["overallScore", "summary", "criteriaResults"]
        }
      }
    });

    if (!response.text) {
      throw new Error("La IA no devolvió texto / AI-k ez du testurik itzuli.");
    }

    const result = JSON.parse(response.text);
    
    return {
      ...result,
      analyzedFileName: fileName
    };

  } catch (error) {
    console.error("Error en auditoría Gemini:", error);
    throw error;
  }
};