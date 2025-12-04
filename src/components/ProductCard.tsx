import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.available || (product.stock !== undefined && product.stock <= 0)) {
      toast.error('This product is currently out of stock');
      return;
    }
    addItem(product);
    toast.success(`${product.title} added to cart!`);
  };

  const isOutOfStock = !product.available || (product.stock !== undefined && product.stock <= 0);

  const categoryLabels = {
    mainline: 'Mainline',
    premium: 'Premium',
    'treasure-hunts': 'Treasure Hunt',
    vintage: 'Vintage',
  };

  const categoryColors = {
    mainline: 'bg-primary/20 text-primary',
    premium: 'bg-accent/20 text-accent',
    'treasure-hunts': 'bg-success/20 text-success',
    vintage: 'bg-warning/20 text-warning',
  };

  const mainImage = product.images?.[0];

  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block aspect-square overflow-hidden bg-muted">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Category Badge */}
      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[product.category]}`}>
        {categoryLabels[product.category]}
      </div>

      {/* Availability Badge */}
      {isOutOfStock && (
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/20 text-destructive">
          Out of Stock
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-lg text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {product.description || 'Premium die-cast collectible'}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-display text-2xl text-primary">
            ₹{product.price.toLocaleString('en-IN')}
          </span>

          <div className="flex gap-2">
            <Link to={`/product/${product.id}`}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Eye className="w-5 h-5" />
              </Button>
            </Link>
            <Button 
              variant="hero" 
              size="icon"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
