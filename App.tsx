
import React, { useState, useCallback } from 'react';
import { UrlInputForm } from './components/UrlInputForm';
import { ProgressBar } from './components/ProgressBar';
import { StatusLog } from './components/StatusLog';
import { XmlOutput } from './components/XmlOutput';
import { classifyUrl, extractProductData } from './services/geminiService';
import { generateXml } from './util/xmlFormatter';
import { Product } from './types';
import { LogoIcon } from './components/icons';

type CrawlStatus = {
  progress: number;
  message: string;
  currentUrl: string;
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [finalXml, setFinalXml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus>({
    progress: 0,
    message: 'Listo para empezar.',
    currentUrl: '',
  });

  const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleExtractCatalog = useCallback(async (baseUrl: string) => {
    setIsLoading(true);
    setProducts([]);
    setFinalXml('');
    setError(null);
    setCrawlStatus({ progress: 0, message: 'Iniciando análisis...', currentUrl: '' });

    try {
      // --- CRAWLER SIMULATION ---
      // In a real-world scenario, a backend service would crawl the site.
      // Here, we simulate finding links to demonstrate the flow.
      const simulatedUrls = [
        `${baseUrl}/category/shoes`,
        `${baseUrl}/product/running-sneakers-x2000`,
        `${baseUrl}/about-us`,
        `${baseUrl}/product/classic-leather-boots`,
        `${baseUrl}/contact`,
        `${baseUrl}/product/summer-sandals-vibe`,
        `${baseUrl}/category/accessories`,
      ];
      const totalUrls = simulatedUrls.length;
      const foundProducts: Product[] = [];

      for (let i = 0; i < totalUrls; i++) {
        const url = simulatedUrls[i];
        const progress = Math.round(((i + 1) / totalUrls) * 100);
        setCrawlStatus({
          progress,
          message: 'Analizando página...',
          currentUrl: url,
        });
        await simulateDelay(1000); // Simulate network latency

        const classification = await classifyUrl(url);

        if (classification.pageType === 'product') {
          setCrawlStatus(prev => ({ ...prev, message: `Página de producto encontrada. Extrayendo datos...` }));
          await simulateDelay(1500); // Simulate API call for extraction
          
          const productData = await extractProductData(url);
          if (productData) {
            foundProducts.push({ ...productData, url });
            setProducts([...foundProducts]);
          }
        } else {
           setCrawlStatus(prev => ({ ...prev, message: `Omitiendo página de tipo '${classification.pageType}'` }));
           await simulateDelay(500);
        }
      }

      setCrawlStatus({ progress: 100, message: 'Análisis completado. Generando XML...', currentUrl: '' });
      await simulateDelay(1000);
      
      const xml = generateXml(foundProducts);
      setFinalXml(xml);
      setCrawlStatus(prev => ({...prev, message: 'Catálogo XML generado con éxito.'}));

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(`Error: ${errorMessage}`);
      setCrawlStatus({ progress: 0, message: 'Proceso detenido por un error.', currentUrl: '' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <LogoIcon className="w-12 h-12 text-brand-blue" />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              ShopScout <span className="text-brand-blue">2.0</span>
            </h1>
          </div>
          <p className="text-gray-400">
            Extrae catálogos de productos de sitios web usando IA.
          </p>
        </header>

        <main className="bg-brand-light-dark p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700/50">
          <div className="w-full">
            <UrlInputForm onSubmit={handleExtractCatalog} isLoading={isLoading} />
          </div>

          {(isLoading || finalXml || error) && (
            <div className="mt-8 space-y-6">
              <div className="h-px bg-gray-700/50"></div>
              {isLoading && (
                 <div>
                    <ProgressBar progress={crawlStatus.progress} />
                    <StatusLog message={crawlStatus.message} currentUrl={crawlStatus.currentUrl} />
                </div>
              )}
               {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg text-center">{error}</div>}
              {finalXml && !isLoading && (
                  <XmlOutput xml={finalXml} />
              )}
            </div>
          )}
           {!isLoading && !finalXml && !error && (
            <div className="mt-8 text-center text-gray-500">
              <p className="text-sm">
                <strong>Nota:</strong> Esta es una demostración. El rastreo de páginas es simulado. 
                Ingrese una URL (ej: https://tiendaficticia.com) para iniciar la simulación de extracción.
              </p>
            </div>
          )}
        </main>

         <footer className="text-center mt-8 text-gray-600 text-sm">
            <p>&copy; {new Date().getFullYear()} ShopScout 2.0. Potenciado por Gemini.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
