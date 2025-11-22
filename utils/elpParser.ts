/**
 * Parses an .elp or .elpx file (which are ZIP archives) and extracts the main content XML.
 * Also scans media files for embedded metadata (EXIF/XMP) regarding licenses.
 * Requires JSZip and exifr to be loaded in the window.
 */

// Helper function to extract metadata from a specific file object from JSZip
const getFileMetadataReport = async (filename: string, fileObj: any): Promise<string | null> => {
  const exifr = (window as any).exifr;
  if (!exifr) return null;

  try {
    // Only process images that support EXIF/XMP typically found in eXe resources
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff'];
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    
    if (!supportedExtensions.includes(ext)) {
      return null; 
    }

    const arrayBuffer = await fileObj.async("arraybuffer");
    
    // Parse metadata looking for specific license tags
    // We enable XMP and IPTC specifically as they store rights info
    const output = await exifr.parse(arrayBuffer, {
      xmp: true,
      iptc: true,
      exif: true,
      // Pick specific tags to save memory/time
      pick: ['Copyright', 'Artist', 'ImageDescription', 'dc:rights', 'dc:creator', 'xmpRights:UsageTerms', 'cc:license', 'WebStatement']
    });

    if (!output || Object.keys(output).length === 0) return null;

    // Filter to only keep relevant fields to reduce token usage
    const relevantKeys = [
      'Copyright', 'Artist', 'ImageDescription', 'Make', 'Model', 
      'dc:rights', 'dc:creator', 'xmpRights:UsageTerms', 'cc:license', 'WebStatement'
    ];

    const foundData: string[] = [];
    for (const key of relevantKeys) {
      // exifr flattens XMP, so dc:rights might appear as just 'rights' or strictly namespaced depending on parsing
      // We iterate the output object to find matches loosely
      for (const [outKey, outVal] of Object.entries(output)) {
         if (typeof outVal === 'string' && outVal.length > 2) { // minimal filter
             // If the key contains "copyright", "rights", "license", "artist", "creator"
             if (/copyright|rights|license|artist|creator|credit/i.test(outKey)) {
                 foundData.push(`${outKey}: "${outVal}"`);
             }
         }
      }
    }

    // Deduplicate
    const uniqueData = [...new Set(foundData)];

    if (uniqueData.length > 0) {
      return `   - Archivo: ${filename}\n     Metadatos: [ ${uniqueData.join(' | ')} ]`;
    }
    
    return null;

  } catch (err) {
    // Silently fail for individual images to not stop the whole process
    return null;
  }
};

export const parseElpFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const JSZip = (window as any).JSZip;

    if (!JSZip) {
      reject(new Error("La librería JSZip no está cargada."));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) {
          reject(new Error("No se pudo leer el archivo."));
          return;
        }

        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // 1. Locate main XML Content
        let contentFile = zip.file("contentv3.xml");
        if (!contentFile) {
          contentFile = zip.file("content.xml");
        }
        
        // Fallback
        if (!contentFile) {
           const files = Object.keys(zip.files);
           const xmlFile = files.find(f => f.endsWith('.xml') && !f.includes('container'));
           if(xmlFile) {
             contentFile = zip.file(xmlFile);
           }
        }

        if (!contentFile) {
          reject(new Error("No se encontró 'contentv3.xml' ni 'content.xml'. Asegúrate de que es un archivo .elp/.elpx válido."));
          return;
        }

        const textContent = await contentFile.async("string");

        // 2. SCAN FOR METADATA IN MEDIA FILES
        // Filter files in the zip
        const mediaFiles = Object.keys(zip.files).filter(name => 
          !name.startsWith('__MACOSX') && 
          /\.(jpg|jpeg|png|webp|tiff)$/i.test(name)
        );

        // Limit checks to first 50 images to prevent browser freeze on huge archives
        const filesToCheck = mediaFiles.slice(0, 50);
        const metadataReports: string[] = [];

        if (filesToCheck.length > 0) {
          // Run in parallel
          const promises = filesToCheck.map(filename => getFileMetadataReport(filename, zip.file(filename)));
          const results = await Promise.all(promises);
          
          results.forEach(res => {
            if (res) metadataReports.push(res);
          });
        }

        let finalOutput = textContent;

        // Append Metadata Report
        if (metadataReports.length > 0) {
          finalOutput += `\n\n==================================================\n`;
          finalOutput += `INFORME TÉCNICO DE METADATOS INCRUSTADOS (ANALIZADO AUTOMÁTICAMENTE)\n`;
          finalOutput += `NOTA: Esta sección contiene información oculta extraída directamente de los archivos de imagen dentro del paquete.\n`;
          finalOutput += `Utiliza esta información para validar el CRITERIO 6 (Licencias) si no aparece texto visible.\n`;
          finalOutput += `==================================================\n`;
          finalOutput += metadataReports.join('\n');
          finalOutput += `\n==================================================\n`;
        } else {
           finalOutput += `\n\n[INFO: No se encontraron metadatos de licencia relevantes incrustados en las imágenes analizadas.]`;
        }

        resolve(finalOutput);

      } catch (err) {
        console.error(err);
        reject(new Error("Error al procesar el archivo .elp. Puede estar corrupto."));
      }
    };

    reader.onerror = () => reject(new Error("Error de lectura de archivo."));
    reader.readAsArrayBuffer(file);
  });
};