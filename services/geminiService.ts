
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const productSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'Nombre del producto.' },
        description: { type: Type.STRING, description: 'Descripción detallada del producto.' },
        price: { type: Type.NUMBER, description: 'Precio principal del producto.' },
        discountedPrice: { type: Type.NUMBER, description: 'Precio con descuento, si aplica.' },
        imageUrl: { type: Type.STRING, description: 'URL de la imagen principal del producto.' },
        variants: {
            type: Type.ARRAY,
            description: 'Variantes como talla o color.',
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: 'Tipo de variante (ej. "Talla").' },
                    value: { type: Type.STRING, description: 'Valor de la variante (ej. "M").' },
                },
            },
        },
        availability: { type: Type.BOOLEAN, description: 'Si el producto está en stock.' },
    },
    required: ['name', 'description', 'price', 'imageUrl', 'variants', 'availability'],
};

/**
 * Classifies a URL as a product page, category page, or other.
 * This is a conceptual function that bases its guess on the URL structure,
 * as client-side code cannot fetch page content directly due to CORS.
 */
export const classifyUrl = async (url: string): Promise<{ pageType: 'product' | 'category' | 'other' }> => {
    try {
        const prompt = `Basado en la siguiente URL de un sitio de comercio electrónico, clasifica el tipo de página. ¿Es una página de producto, una página de categoría u otro tipo de página (como 'sobre nosotros', 'contacto', 'inicio')? Responde únicamente con un objeto JSON con la clave "pageType" y el valor "product", "category", u "other". URL: ${url}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        pageType: { type: Type.STRING },
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result.pageType === 'product' || result.pageType === 'category') {
            return { pageType: result.pageType };
        }
        return { pageType: 'other' };
    } catch (error) {
        console.error('Error classifying URL:', error);
        return { pageType: 'other' }; // Default to 'other' on error
    }
};


/**
 * Extracts product data from a given URL.
 * This is a conceptual function. Since we cannot access the page content,
 * it asks Gemini to generate realistic mock data based on the URL's structure.
 */
export const extractProductData = async (url: string): Promise<Omit<Product, 'url'> | null> => {
     try {
        const prompt = `Eres un sistema experto en la generación de datos de prueba para comercio electrónico. Dada la URL de un producto, crea un conjunto de datos ficticios pero realistas para este producto. Debes seguir el esquema JSON proporcionado de forma precisa. No inventes una URL para la imagen, en su lugar, utiliza un placeholder de picsum.photos con un tamaño de 800x800. URL del producto: ${url}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: productSchema,
            },
        });

        const jsonText = response.text.trim();
        const productData = JSON.parse(jsonText) as Omit<Product, 'url'>;
        
        // Ensure image is a placeholder
        if (!productData.imageUrl || !productData.imageUrl.includes('picsum.photos')) {
            productData.imageUrl = 'https://picsum.photos/800/800';
        }
        
        return productData;
    } catch (error) {
        console.error('Error extracting product data:', error);
        return null;
    }
};
