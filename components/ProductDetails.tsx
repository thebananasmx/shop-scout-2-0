
import React from 'react';
import { Product, Variant } from '../types';

interface ProductDetailsProps {
  product: Product;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <div className={`grid grid-cols-3 gap-4 py-3 border-b border-gray-700/50 ${className}`}>
    <dt className="text-sm font-medium text-gray-400">{label}</dt>
    <dd className="text-sm text-white col-span-2">{value}</dd>
  </div>
);

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  return (
    <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-200">Datos Extraídos del Producto:</h3>
        <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4">
                <div className="flex flex-col sm:flex-row gap-6">
                     <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full sm:w-40 h-40 object-cover rounded-lg flex-shrink-0 border-2 border-gray-700"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150/1a202c/ffffff?text=Img';
                        }}
                    />
                    <div className="flex-grow">
                        <h4 className="text-xl font-bold text-white">{product.name}</h4>
                        <div className="flex items-baseline gap-3 mt-2">
                           {product.discountedPrice ? (
                                <>
                                    <span className="text-3xl font-bold text-brand-blue">${product.discountedPrice}</span>
                                    <span className="text-xl text-gray-500 line-through">${product.price}</span>
                                </>
                            ) : (
                                <span className="text-3xl font-bold text-brand-blue">${product.price}</span>
                            )}
                        </div>
                         <p className={`text-sm font-bold mt-2 px-2 py-1 inline-block rounded ${product.availability ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {product.availability ? 'Disponible' : 'Agotado'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-2 bg-gray-800/30">
                 <dl>
                    <DetailRow label="URL" value={<a href={product.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline break-all">{product.url}</a>} />
                    <DetailRow label="Descripción" value={<p className="whitespace-pre-wrap">{product.description}</p>} />
                     {product.variants && product.variants.length > 0 && (
                        <DetailRow 
                            label="Variantes" 
                            value={
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v, i) => (
                                        <span key={i} className="px-2 py-1 text-xs bg-gray-700 rounded-full">{v.type}: {v.value}</span>
                                    ))}
                                </div>
                            }
                        />
                    )}
                 </dl>
            </div>
        </div>
    </div>
  );
};
