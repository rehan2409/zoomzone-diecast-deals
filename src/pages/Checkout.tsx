import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateInvoice } from '@/lib/invoiceGenerator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Upload,
  Check,
  Loader2,
  ShoppingBag,
  FileText,
  ImageOff,
  AlertCircle
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentQR, setPaymentQR] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    });

    fetchPaymentQR();

    return () => subscription.unsubscribe();
  }, []);

  const fetchPaymentQR = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'payment_qr')
        .maybeSingle();

      if (data?.value) {
        setPaymentQR(data.value);
      }
    } catch (error) {
      console.error('Error fetching payment QR:', error);
    }
  };

  const subtotal = getSubtotal();
  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error || !coupon) {
        toast.error('Invalid coupon code');
        setApplyingCoupon(false);
        return;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error('This coupon has expired');
        setApplyingCoupon(false);
        return;
      }

      // Check minimum purchase
      if (coupon.min_purchase && subtotal < coupon.min_purchase) {
        toast.error(`Minimum purchase of ₹${coupon.min_purchase} required`);
        setApplyingCoupon(false);
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error('This coupon has reached its usage limit');
        setApplyingCoupon(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      setDiscount(Math.min(discountAmount, subtotal));
      setAppliedCoupon(coupon);
      toast.success('Coupon applied successfully!');
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setPaymentScreenshot(file);
    setPaymentScreenshotUrl(URL.createObjectURL(file));
  };


  const handleSubmitOrder = async () => {
    if (!user) {
      toast.error('Please sign in to complete your order');
      navigate('/auth?redirect=checkout');
      return;
    }

    if (!fullName || !email || !phone || !address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!paymentScreenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setLoading(true);

    try {
      // Upload payment screenshot
      const fileExt = paymentScreenshot.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, paymentScreenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Create order
      const orderData = {
        user_id: user.id,
        customer_name: fullName,
        customer_email: email,
        customer_phone: phone,
        customer_address: address,
        customer_notes: notes || null,
        items: JSON.parse(JSON.stringify(items)),
        subtotal: subtotal,
        discount: discount,
        total: total,
        coupon_code: appliedCoupon?.code || null,
        status: 'pending',
        payment_screenshot: urlData.publicUrl,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Update coupon usage
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Deduct stock for each product
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product.id)
          .single();
        
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product.id);
        }
      }

      setOrderId(order.id);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to complete your purchase</p>
          <Link to="/auth?redirect=checkout">
            <Button variant="hero" size="lg">
              Sign In to Continue
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Empty cart
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">Add some items to your cart before checkout</p>
          <Link to="/">
            <Button variant="hero" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Order complete
  if (orderComplete && orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-display text-3xl mb-4">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mb-2">
              Your order ID: <span className="font-mono text-foreground">{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-muted-foreground mb-8">
              We'll notify you once your order is confirmed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero"
                size="lg"
                onClick={() => {
                  const orderData = {
                    id: orderId,
                    customer_name: fullName,
                    customer_email: email,
                    customer_phone: phone,
                    customer_address: address,
                    items: items,
                    subtotal: subtotal,
                    discount: discount,
                    total: total,
                  };
                  generateInvoice(orderData);
                }}
              >
                <FileText className="w-5 h-5" />
                Download Invoice
              </Button>
              <Link to="/orders">
                <Button variant="chrome" size="lg">
                  View Orders
                </Button>
              </Link>
            </div>
          </div>
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
        <h1 className="font-display text-3xl md:text-4xl mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-display text-xl mb-6">Delivery Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="Full delivery address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 min-h-[80px]"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-display text-xl mb-4">Coupon Code</h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span className="font-semibold text-success">{appliedCoupon.code}</span>
                    <span className="text-muted-foreground">- ₹{discount.toLocaleString('en-IN')} off</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                  >
                    {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-display text-xl mb-4">Payment</h2>
              
              {paymentQR ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Scan the QR code below to make payment, then upload the screenshot.
                  </p>
                  <div className="flex justify-center">
                    <img 
                      src={paymentQR} 
                      alt="Payment QR Code" 
                      className="w-64 h-64 object-contain border border-border rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Payment QR not available. Please contact support.</p>
              )}

              <div className="mt-6 space-y-2">
                <Label>Upload Payment Screenshot *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {paymentScreenshotUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={paymentScreenshotUrl} 
                        alt="Payment screenshot" 
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-2 text-success">
                        <Check className="w-5 h-5" />
                        <span>Screenshot uploaded</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setPaymentScreenshot(null);
                          setPaymentScreenshotUrl(null);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-2">Click to upload screenshot</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h2 className="font-display text-xl mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.product.title}</p>
                      <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                      <p className="text-primary font-semibold">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full mt-6"
                onClick={handleSubmitOrder}
                disabled={loading || !paymentScreenshot}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Complete Order
                  </>
                )}
              </Button>

              {!paymentScreenshot && (
                <p className="text-destructive text-sm text-center mt-2">
                  Please upload payment screenshot to complete order
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
