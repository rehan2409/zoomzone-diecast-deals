import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types';
import { 
  Loader2, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ImageOff
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

const Orders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate('/auth?redirect=orders');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth?redirect=orders');
      } else {
        fetchOrders(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as unknown as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'accepted':
        return 'bg-success/20 text-success border-success/30';
      case 'rejected':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your orders</p>
          <Link to="/auth?redirect=orders">
            <Button variant="hero" size="lg">
              Sign In
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
        <h1 className="font-display text-3xl md:text-4xl mb-8">My Orders</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="font-display text-xl mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Link to="/">
              <Button variant="hero" size="lg">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="bg-card rounded-xl border border-border p-6"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-muted-foreground text-sm">Order ID</p>
                    <p className="font-mono font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Date</p>
                    <p className="font-semibold">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full border
                    ${getStatusColor(order.status)}
                  `}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize font-semibold">{order.status}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">
                          {item.product?.title || 'Product'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Qty: {item.quantity} × ₹{item.product?.price?.toLocaleString('en-IN') || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    {order.discount > 0 && (
                      <p className="text-success text-sm">
                        Discount: -₹{order.discount.toLocaleString('en-IN')}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      Subtotal: ₹{order.subtotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Total</p>
                    <p className="font-display text-2xl text-primary">
                      ₹{order.total.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
