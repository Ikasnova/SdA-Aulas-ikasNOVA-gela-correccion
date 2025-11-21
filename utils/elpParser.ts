/**
 * Parses an .elp or .elpx file (which are ZIP archives) and extracts the main content XML.
 * Requires JSZip to be loaded in the window.
 */
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
        
        // eXeLearning usually stores structure in contentv3.xml or content.xml
        let contentFile = zip.file("contentv3.xml");
        if (!contentFile) {
          contentFile = zip.file("content.xml");
        }
        
        // If strictly eXe structure isn't found, try index.html as fallback for exported sites,
        // but for .elp, xml is expected.
        if (!contentFile) {
           // Try to find any XML file larger than 1KB as a fallback
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
        resolve(textContent);

      } catch (err) {
        console.error(err);
        reject(new Error("Error al procesar el archivo .elp. Puede estar corrupto."));
      }
    };

    reader.onerror = () => reject(new Error("Error de lectura de archivo."));
    reader.readAsArrayBuffer(file);
  });
};