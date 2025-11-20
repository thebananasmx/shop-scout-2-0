
import { Product, Variant } from '../types';

const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

const createNode = (name: string, value: any, indent: string): string => {
    if (value === undefined || value === null) return '';
    const escapedValue = escapeXml(String(value));
    return `${indent}<${name}>${escapedValue}</${name}>\n`;
};

const createVariantsNode = (variants: Variant[], indent: string): string => {
    if (!variants || variants.length === 0) return '';
    let variantsXml = `${indent}<variants>\n`;
    variants.forEach(variant => {
        variantsXml += `${indent}  <variant>\n`;
        variantsXml += createNode('type', variant.type, `${indent}    `);
        variantsXml += createNode('value', variant.value, `${indent}    `);
        variantsXml += `${indent}  </variant>\n`;
    });
    variantsXml += `${indent}</variants>\n`;
    return variantsXml;
};

export const generateXml = (products: Product[]): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<catalog>\n';

    products.forEach(product => {
        xml += '  <product>\n';
        xml += createNode('url', product.url, '    ');
        xml += createNode('name', product.name, '    ');
        xml += createNode('description', product.description, '    ');
        xml += createNode('price', product.price, '    ');
        if (product.discountedPrice) {
            xml += createNode('discounted_price', product.discountedPrice, '    ');
        }
        xml += createNode('image_url', product.imageUrl, '    ');
        xml += createNode('availability', product.availability, '    ');
        xml += createVariantsNode(product.variants, '    ');
        xml += '  </product>\n';
    });

    xml += '</catalog>';
    return xml;
};
