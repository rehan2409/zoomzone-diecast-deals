import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product, CategoryType, CategoryInfo } from '@/types';

const categories: CategoryInfo[] = [
  { id: 'mainline', name: 'Mainline', description: 'Standard releases for everyday collectors', icon: 'car' },
  { id: 'premium', name: 'Premium / Real Riders', description: 'Enhanced details with rubber tires', icon: 'crown' },
  { id: 'treasure-hunts', name: 'Treasure Hunts', description: 'Rare TH & Super TH editions', icon: 'gem' },
  { id: 'vintage', name: 'Vintage / Redlines', description: 'Classic collectibles from the past', icon: 'clock' },
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />
      
      <main>
        <Hero />

        {/* Categories Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                Browse by Category
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find your perfect collectible from our curated selection
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  description={category.description}
                  isActive={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? 'all' : category.id
                  )}
                />
              ))}
            </div>

            {selectedCategory !== 'all' && (
              <div className="text-center mt-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedCategory('all')}
                  className="text-primary"
                >
                  Show All Products
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                {selectedCategory === 'all' ? 'All Products' : `${categories.find(c => c.id === selectedCategory)?.name || ''} Collection`}
              </h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-4">
                  Check back soon for new arrivals!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
