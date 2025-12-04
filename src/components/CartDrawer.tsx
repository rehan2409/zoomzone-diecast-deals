import { X, Plus, Minus, Trash2, ShoppingBag, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleCheckout = () => {
    closeCart();
    if (user) {
      navigate('/checkout');
    } else {
      navigate('/auth?redirect=checkout');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl">Your Cart</h2>
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={closeCart}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button variant="hero" onClick={closeCart}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.product.id}
                    className="flex gap-4 p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{item.product.title}</h3>
                      <p className="text-primary font-display text-lg">
                        ₹{item.product.price.toLocaleString('en-IN')}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.stock)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.stock)}
                          disabled={item.quantity >= (item.product.stock || 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {item.quantity >= (item.product.stock || 1) && (
                        <p className="text-xs text-warning mt-1">Max available: {item.product.stock || 1}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-2xl text-primary">
                  ₹{getSubtotal().toLocaleString('en-IN')}
                </span>
              </div>
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={closeCart}
              >
                Continue Shopping
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
