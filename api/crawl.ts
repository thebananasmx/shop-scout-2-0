
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

// This is a Vercel Serverless Function
// It needs to be placed in the /api directory of your project

// --- Main Handler for the Vercel Function ---
export default async function handler(req: any, res: any) {
    console.log("Crawler function invoked.");

    // Critical: Check for API Key at the very beginning.
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set!");
        return res.status(500).json({ 
            error: 'Error de configuración del servidor.', 
            details: 'La API_KEY de Gemini no está configurada en las variables de entorno de Vercel.' 
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    if (!req.body) {
         return res.status(400).json({ error: 'Request body is missing' });
    }

    const { startUrl } = req.body;

    if (!startUrl) {
        return res.status(400).json({ error: 'startUrl is required' });
    }
    
    console.log(`Starting crawl for: ${startUrl}`);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fastModel = "gemini-2.5-flash";
        const powerfulModel = "gemini-3-pro-preview";

        // Step 1: Fetch homepage and find PDP links directly in one step
        console.log("Step 1: Fetching homepage...");
        const fetchOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };
        const homeResponse = await fetch(startUrl, fetchOptions);
        if (!homeResponse.ok) {
            console.error(`Failed to fetch start URL: ${homeResponse.statusText}`);
            return res.status(500).json({ error: `Failed to fetch start URL: ${homeResponse.statusText}` });
        }
        const homeHtml = await homeResponse.text();
        console.log("Homepage fetched. Finding PDP links with Gemini...");
        let pdpUrls = await findAndClassifyPdpLinks(ai, fastModel, homeHtml, startUrl);

        // Limit links to process to avoid long execution times
        pdpUrls = pdpUrls.slice(0, 5);
        console.log(`Found ${pdpUrls.length} potential PDP links to process.`);
        
        if (pdpUrls.length === 0) {
             return res.status(200).json([]);
        }

        // Step 2: Fetch each PDP and extract product data
        console.log("Step 2: Extracting data from PDPs...");
        const extractionPromises = pdpUrls.map(async (url) => {
            try {
                const pdpResponse = await fetch(url, fetchOptions);
                if (!pdpResponse.ok) return null;
                const pdpHtml = await pdpResponse.text();
                return await extractProductDataFromHtml(ai, powerfulModel, pdpHtml, url);
            } catch (e) {
                console.error(`Failed to fetch or process ${url}`, e);
                return null;
            }
        });

        const products = (await Promise.all(extractionPromises)).filter(p => p !== null) as Product[];
        console.log(`Successfully extracted data for ${products.length} products.`);

        // Step 3: Respond with the found products
        console.log("Step 3: Sending response.");
        return res.status(200).json(products);

    } catch (error) {
        console.error('Crawling failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: 'An internal server error occurred during the crawl.', details: errorMessage });
    }
}


// --- Gemini Schemas and Functions ---

const productSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        price: { type: Type.NUMBER },
        discountedPrice: { type: Type.NUMBER },
        imageUrl: { type: Type.STRING },
        variants: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    value: { type: Type.STRING },
                },
                 required: ['type', 'value'],
            },
        },
        availability: { type: Type.BOOLEAN },
    },
    required: ['name', 'description', 'price', 'imageUrl', 'availability', 'variants'],
};


async function findAndClassifyPdpLinks(ai: GoogleGenAI, model: string, html: string, baseUrl: string): Promise<string[]> {
    const prompt = `
        Analiza el siguiente código HTML de una página de comercio electrónico. Extrae todas las URLs internas únicas que parezcan ser Páginas de Detalles de Producto (PDPs).
        Enfócate en enlaces que claramente lleven a un producto individual, no a categorías, listas de productos o páginas informativas.
        Devuelve solo una lista de URLs de PDPs en formato JSON. Ej: ["/producto/zapato-rojo", "/producto/bota-negra"].
        Asegúrate de que las URLs sean relativas al sitio (empiecen con /) o sean URLs completas del mismo dominio.
        HTML:
        ${html.substring(0, 30000)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
        });
        
        const rawText = response.text;
        try {
            const links = JSON.parse(rawText) as string[];
            const uniqueLinks = [...new Set(links)]; // Ensure uniqueness
            // Resolve relative URLs to absolute URLs
            return uniqueLinks.map(link => new URL(link, baseUrl).href);
        } catch(e) {
            console.error("Error parsing JSON for PDP links. Raw Gemini response:", rawText);
            return []; // Return empty array if parsing fails
        }

    } catch (e) {
        console.error("Error finding and classifying PDP links with Gemini:", e);
        return [];
    }
}


async function extractProductDataFromHtml(ai: GoogleGenAI, model: string, html: string, url: string): Promise<Product | null> {
     const prompt = `
        Eres un experto en extracción de datos de comercio electrónico. Analiza el siguiente HTML de una página de producto y extrae la información detallada del producto.
        URL de origen: ${url}
        HTML:
        ${html.substring(0, 25000)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: productSchema,
            }
        });
        
        const rawText = response.text;
        try {
            const data = JSON.parse(rawText) as Omit<Product, 'url'>;
            return { ...data, url };
        } catch (e) {
            console.error(`Error parsing JSON for product data on ${url}. Raw Gemini response:`, rawText);
            return null; // Return null if parsing fails
        }
    } catch (e) {
        console.error(`Error extracting data for ${url} with Gemini:`, e);
        return null;
    }
}
