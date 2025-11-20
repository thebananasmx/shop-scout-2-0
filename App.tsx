
import React, { useState, useCallback } from 'react';
import { XmlOutput } from './components/XmlOutput';
import { generateXml } from './util/xmlFormatter';
import { Product } from './types';
import { LogoIcon } from './components/icons';
import { UrlInputForm } from './components/UrlInputForm';
import { ProductDetails } from './components/ProductDetails';


const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [finalXml, setFinalXml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasCrawled, setHasCrawled] = useState(false);


  const handleExtract = useCallback(async (startUrl: string) => {
    setIsLoading(true);
    setError(null);
    setProducts([]);
    setFinalXml('');
    setHasCrawled(true);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
      }

      const foundProducts: Product[] = await response.json();
      
      if (foundProducts.length > 0) {
        setProducts(foundProducts);
        const xml = generateXml(foundProducts);
        setFinalXml(xml);
      } else {
         setError("No se encontraron productos en la URL proporcionada.");
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido durante el rastreo.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <LogoIcon className="w-12 h-12 text-brand-blue" />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              ShopScout <span className="text-brand-blue">2.0</span>
            </h1>
          </div>
          <p className="text-gray-400">
            Crawler de e-commerce y generador de catálogos XML, potenciado por IA.
          </p>
        </header>

        <main className="bg-brand-light-dark p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700/50">
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center text-gray-400 space-y-2 mb-6">
               <p className="text-sm font-semibold">
                ¿Cómo funciona?
              </p>
              <ol className="text-xs text-center list-inside space-y-1 mt-2">
                <li>1. Ingresa la URL de la página de inicio de una tienda (ej. https://tienda.com/).</li>
                <li>2. Un crawler en el servidor analizará la página, buscará productos y extraerá sus datos con IA.</li>
                <li className="font-bold text-green-400/80 pt-1">Nota: Este es un crawler real que se ejecuta en el backend para evitar restricciones del navegador.</li>
              </ol>
            </div>
            <UrlInputForm onSubmit={handleExtract} isLoading={isLoading} />
          </div>

          {isLoading && (
            <div className="mt-8 text-center text-brand-blue">
                <div role="status" className="flex justify-center items-center gap-2">
                    <svg aria-hidden="true" className="w-8 h-8 text-gray-600 animate-spin fill-brand-blue" viewBox="0 0 100 101" fill="none" xmlns="http://www.w.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="text-lg">Rastreando el sitio... Esto puede tardar un momento.</span>
                </div>
            </div>
          )}

          {hasCrawled && !isLoading && (
             <div className="mt-8">
                {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg text-center">{error}</div>}
                {products.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                        <div className="lg:col-span-3 space-y-6">
                           {products.map(p => <ProductDetails key={p.url} product={p} />)}
                        </div>
                        <div className="lg:col-span-2 sticky top-8">
                            <XmlOutput xml={finalXml} />
                        </div>
                    </div>
                )}
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
