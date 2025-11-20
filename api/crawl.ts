
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

// This is a Vercel Serverless Function
// It needs to be placed in the /api directory of your project

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-3-pro-preview"; // Use a powerful model for these tasks

// --- Gemini Schemas and Prompts ---

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


async function getLinksFromHtml(html: string, baseUrl: string): Promise<string[]> {
    const prompt = `
        Analiza el siguiente código HTML de una página de comercio electrónico. Extrae todas las URLs internas únicas que encuentres.
        Devuelve solo una lista de URLs en formato JSON. Ej: ["/producto/a", "/categoria/b"].
        Asegúrate de que las URLs sean relativas al sitio (empiecen con /) o sean URLs completas del mismo dominio.
        HTML:
        ${html.substring(0, 20000)}
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
        });
        const links = JSON.parse(response.text) as string[];
        const uniqueLinks = [...new Set(links)]; // Ensure uniqueness
        // Resolve relative URLs to absolute URLs
        return uniqueLinks.map(link => new URL(link, baseUrl).href);
    } catch (e) {
        console.error("Error extracting links:", e);
        return [];
    }
}

async function classifyUrlAsProductPage(url: string): Promise<boolean> {
    const prompt = `
        ¿La siguiente URL parece ser una Página de Detalles de Producto (PDP) de un sitio de comercio electrónico?
        Responde solo con "true" o "false".
        URL: ${url}
    `;
     try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        return response.text.trim().toLowerCase() === 'true';
    } catch (e) {
        console.error(`Error classifying URL ${url}:`, e);
        return false;
    }
}

async function extractProductDataFromHtml(html: string, url: string): Promise<Product | null> {
     const prompt = `
        Eres un experto en extracción de datos de comercio electrónico. Analiza el siguiente HTML de una página de producto y extrae la información detallada del producto.
        URL de origen: ${url}
        HTML:
        ${html.substring(0, 25000)}
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: productSchema,
            }
        });
        const data = JSON.parse(response.text) as Omit<Product, 'url'>;
        return { ...data, url };
    } catch (e) {
        console.error(`Error extracting data for ${url}:`, e);
        return null;
    }
}


// --- Main Handler for the Vercel Function ---

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { startUrl } = req.body;

    if (!startUrl) {
        return res.status(400).json({ error: 'startUrl is required' });
    }

    try {
        // Step 1: Fetch homepage and extract links
        const homeResponse = await fetch(startUrl);
        if (!homeResponse.ok) {
            return res.status(500).json({ error: `Failed to fetch start URL: ${homeResponse.statusText}` });
        }
        const homeHtml = await homeResponse.text();
        let links = await getLinksFromHtml(homeHtml, startUrl);

        // Limit links to process to avoid long execution times
        links = links.slice(0, 10);

        // Step 2: Classify links to find PDPs
        const classificationPromises = links.map(async (link) => ({
            url: link,
            isPdp: await classifyUrlAsProductPage(link)
        }));
        const classifiedLinks = await Promise.all(classificationPromises);
        const pdpUrls = classifiedLinks.filter(l => l.isPdp).map(l => l.url);
        
        if (pdpUrls.length === 0) {
             return res.status(200).json([]);
        }

        // Step 3: Fetch each PDP and extract product data
        const extractionPromises = pdpUrls.map(async (url) => {
            try {
                const pdpResponse = await fetch(url);
                if (!pdpResponse.ok) return null;
                const pdpHtml = await pdpResponse.text();
                return await extractProductDataFromHtml(pdpHtml, url);
            } catch (e) {
                console.error(`Failed to fetch or process ${url}`, e);
                return null;
            }
        });

        const products = (await Promise.all(extractionPromises)).filter(p => p !== null) as Product[];

        // Step 4: Respond with the found products
        return res.status(200).json(products);

    } catch (error) {
        console.error('Crawling failed:', error);
        return res.status(500).json({ error: 'An internal server error occurred during the crawl.' });
    }
}
