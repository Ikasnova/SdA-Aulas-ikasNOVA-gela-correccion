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
    Actúa como un auditor experto y estricto en normativa educativa de Navarra (España) y calidad de Recursos Educativos Abiertos (REA) para eXeLearning.
    Analiza el siguiente contenido XML extraído de un archivo .elp.
    
    Tu objetivo es generar un informe riguroso en CASTELLANO. 
    IMPORTANTE: Para los criterios 6, 7 y 8, debes realizar una VERIFICACIÓN DOBLE y EXHAUSTIVA.

    CRITERIOS A EVALUAR:

    1. Ajuste al currículum de Navarra (Análisis de Etapa):
       - PASO 1: Identifica la ETAPA educativa a la que se dirige el recurso (Infantil, Primaria, ESO, Bachillerato o FP). Busca pistas en el texto (ej: "cursos 1º", "bachiller", etc.).
       - PASO 2: Verifica si la normativa citada corresponde a esa etapa en Navarra.
         * Infantil: Decreto Foral 61/2022.
         * Primaria: Decreto Foral 67/2022.
         * ESO: Decreto Foral 71/2022.
         * Bachillerato: Decreto Foral 72/2022.
       - Items: Crea una fila indicando la "Etapa Detectada", otra para "Normativa Citada" y verifica si coinciden.

    2. Realización de cambios exigidos:
       - Estructura completa (Introducción, Desarrollo, Cierre/Evaluación).
       - Contenido real (detectar "Lorem ipsum", texto simulado o plantillas vacías).

    3. Redacción cercana y precisa:
       - Tono adecuado al alumnado.
       - Claridad en instrucciones.

    4. Lenguaje no discriminatorio:
       - Uso de lenguaje inclusivo (alumnado, infancia, profesorado).
       - Evitar masculino genérico excluyente.

    5. Ortografía y coherencia:
       - Detección de faltas ortográficas o gramaticales evidentes.

    --- ANÁLISIS EXHAUSTIVO Y DETALLADO (PUNTOS CRÍTICOS) ---
    Para los siguientes puntos (6, 7 y 8), es OBLIGATORIO listar CADA elemento encontrado. NO resumas. NO agrupes.
    Si encuentras 20 imágenes, la lista 'items' debe tener 20 entradas.

    6. Licencias abiertas (Inventario COMPLETO ítem por ítem):
       - Identifica TODOS los recursos multimedia (imágenes, vídeos, audios, adjuntos) dentro del XML.
       - En "items", genera una fila INDIVIDUAL por cada recurso. NO agrupes "Varias imágenes".
       - Label: Nombre del archivo (ej: 'foto1.jpg') o descripción clara de la ubicación.
       - Details: La licencia EXACTA detectada (ej: "CC BY-SA 4.0 en pie de foto", "Copyright en metadatos", "No indicada").
       - Pass: TRUE solo si es explícitamente abierta (CC BY, SA, NC, Dominio Público). FALSE si es Copyright o no se encuentra.

    7. Citas y créditos (Inventario COMPLETO):
       - Identifica cada mención de autoría externa.
       - En "items", lista CADA cita por separado.
       - Details: Estado de la cita (ej: "Falta título", "Correcta").

    8. Enlaces (Inventario COMPLETO de TODOS los enlaces):
       - Analiza TODAS las etiquetas <a> del documento.
       - En "items", genera una fila por CADA enlace sin excepción.
       - Label: Texto del enlace (anchor) y URL destino.
       - Details: Atributo 'target' real encontrado (ej: '_self', '_blank', 'vacío').
       - Pass: TRUE estrictamente si tiene target="_blank". FALSE si abre en la misma ventana.
  `,
  eu: `
    Jardun Nafarroako (Espainia) hezkuntza-arautegiko eta eXeLearning-eko Baliabide Irekietako (REA) aditu zorrotz gisa.
    Analizatu .elp fitxategi batetik ateratako hurrengo XML edukia.
    
    Zure helburua txosten zorrotz bat sortzea da EUSKARAZ.
    GARRANTZITSUA: 6, 7 eta 8 irizpideetarako, EGIAZTAPEN BIKOITZA eta OSOA egin behar duzu.

    EBALUATU BEHARREKO IRIZPIDEAK:

    1. Nafarroako curriculumarekiko egokitzapena (Etaparen Analisia):
       - 1. URRATSA: Identifikatu baliabidearen hezkuntza-ETAPA.
       - 2. URRATSA: Egiaztatu aipatutako araudia Nafarroako etapa horri dagokion.
       - Items: Sortu errenkada bat "Detektatutako Etapa" adierazteko, eta beste bat "Aipatutako Araudia"rentzat.

    2. Eskatutako aldaketak egitea:
       - Egitura osoa (Sarrera, Garapena, Amaiera/Ebaluazioa).
       - Benetako edukia ("Lorem ipsum" edo txantiloi hutsak detektatu).

    3. Idazkera hurbila eta zehatza:
       - Ikasleei egokitutako tonua.
       - Argibideetan argitasuna.

    4. Hizkera ez-diskriminatzailea:
       - Hizkera inklusiboaren erabilera.

    5. Ortografia eta koherentzia:
       - Falta ortografiko edo gramatikal nabarmenak detektatu.

    --- ANALISI OSOA ETA ZEHATZA (PUNTU KRITIKOAK) ---
    Hurrengo puntuetarako (6, 7 eta 8), NAHITAEZKOA da elementu BAKOITZA zerrendatzea. EZ laburbildu. EZ multzokatu.

    6. Lizentzia irekiak (Inbentario OSOA elementuz elementu):
       - Identifikatu baliabide GUZTIAK (irudiak, bideoak, audioak).
       - "items" atalean, sortu errenkada BANAKOA baliabide bakoitzeko.
       - Label: Fitxategiaren izena edo deskribapena.
       - Details: Aurkitutako lizentzia ZEHATZA.
       - Pass: TRUE soilik lizentzia esplizituki irekia bada.

    7. Aipamenak eta kredituak (Inbentario OSOA):
       - Identifikatu kanpo-egiletzaren aipamen bakoitza.
       - "items" atalean, zerrendatu aipamen BAKOITZA bereizita.

    8. Estekak (Esteka GUZTIEN inbentario OSOA):
       - Analizatu dokumentuko <a> etiketa GUZTIAK.
       - "items" atalean, sortu errenkada bat esteka BAKOITZEKO salbuespenik gabe.
       - Label: Estekaren testua eta URL.
       - Details: Aurkitutako 'target' atributua.
       - Pass: TRUE soilik target="_blank" bada.
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "Puntuación/Puntuazioa (0-100)." },
            summary: { type: Type.STRING, description: "Resumen ejecutivo incluyendo la etapa educativa detectada / Laburpen exekutiboa detektatutako etapa barne." },
            criteriaResults: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  name: { type: Type.STRING, description: "Nombre del criterio en el idioma solicitado / Irizpidearen izena." },
                  status: { type: Type.STRING, enum: ["PASS", "WARNING", "FAIL"] },
                  observation: { type: Type.STRING, description: "Resumen cualitativo / Behaketa." },
                  items: {
                    type: Type.ARRAY,
                    description: "Lista detallada y verificada elemento a elemento / Zerrenda zehatza eta egiaztatua.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING, description: "Elemento identificado / Elementua." },
                        pass: { type: Type.BOOLEAN },
                        details: { type: Type.STRING, description: "Detalles rigurosos del hallazgo / Aurkikuntzaren xehetasun zorrotzak." }
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