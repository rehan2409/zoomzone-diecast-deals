import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Loader2, 
  ImageOff,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data as Product);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!product.available) {
      toast.error('This product is currently unavailable');
      return;
    }
    addItem(product);
    toast.success(`${product.title} added to cart!`);
  };

  const nextImage = () => {
    if (product?.images) {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images) {
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const categoryLabels = {
    mainline: 'Mainline',
    premium: 'Premium / Real Riders',
    'treasure-hunts': 'Treasure Hunt',
    vintage: 'Vintage / Redlines',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-4">Product Not Found</h1>
          <Link to="/">
            <Button variant="hero">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="w-20 h-20 text-muted-foreground" />
                </div>
              )}

              {/* Navigation Arrows */}
              {product.images && product.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`
                      w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all
                      ${selectedImage === index 
                        ? 'border-primary shadow-card-hover' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {categoryLabels[product.category]}
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl text-foreground">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="font-display text-4xl text-primary">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.available ? (
                <span className="flex items-center gap-1 text-success text-sm">
                  <Check className="w-4 h-4" />
                  In Stock
                </span>
              ) : (
                <span className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Sold Out
                </span>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'A premium die-cast collectible from our curated collection. Perfect for enthusiasts and collectors alike.'}
              </p>
            </div>

            {/* Add to Cart */}
            <div className="pt-4">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleAddToCart}
                disabled={!product.available}
              >
                <ShoppingCart className="w-5 h-5" />
                {product.available ? 'Add to Cart' : 'Sold Out'}
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold text-foreground mb-1">Authentic</h4>
                <p className="text-sm text-muted-foreground">100% genuine collectibles</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold text-foreground mb-1">Secure</h4>
                <p className="text-sm text-muted-foreground">Safe payment & delivery</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
