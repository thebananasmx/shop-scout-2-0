
export interface Variant {
  type: string;
  value: string;
}

export interface Product {
  url: string;
  name:string;
  description: string;
  price: number;
  discountedPrice?: number;
  imageUrl: string;
  variants: Variant[];
  availability: boolean;
}