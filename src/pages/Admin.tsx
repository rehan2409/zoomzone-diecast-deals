import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Product, Coupon, Order, Setting } from '@/types';
import { toast } from 'sonner';
import {
  Lock,
  Package,
  Tag,
  Settings,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Upload,
  Loader2,
  Check,
  X,
  Eye,
  ImageOff,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const ADMIN_PASSWORD = 'zoomzone2025';

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentQR, setPaymentQR] = useState<string | null>(null);

  // Form states
  const [productForm, setProductForm] = useState({
    id: '',
    title: '',
    description: '',
    price: '',
    category: 'mainline' as Product['category'],
    available: true,
    images: [] as string[],
  });
  const [couponForm, setCouponForm] = useState({
    id: '',
    code: '',
    discount_type: 'percentage' as Coupon['discount_type'],
    discount_value: '',
    min_purchase: '',
    max_uses: '',
    expires_at: '',
  });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      fetchAllData();
      toast.success('Welcome to Admin Dashboard');
    } else {
      toast.error('Invalid password');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProducts(),
      fetchCoupons(),
      fetchOrders(),
      fetchPaymentQR(),
    ]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProducts(data as Product[]);
  };

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setCoupons(data as Coupon[]);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setOrders(data as unknown as Order[]);
  };

  const fetchPaymentQR = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'payment_qr')
      .maybeSingle();
    if (data?.value) setPaymentQR(data.value);
  };

  // Product functions
  const handleProductImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));
    setUploadingImages(false);
    toast.success(`${uploadedUrls.length} images uploaded`);
  };

  const handleSaveProduct = async () => {
    if (!productForm.title || !productForm.price) {
      toast.error('Title and price are required');
      return;
    }

    setLoading(true);
    const productData = {
      title: productForm.title,
      description: productForm.description || null,
      price: parseFloat(productForm.price),
      category: productForm.category,
      available: productForm.available,
      images: productForm.images,
    };

    if (productForm.id) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productForm.id);
      if (error) {
        toast.error('Failed to update product');
      } else {
        toast.success('Product updated');
        fetchProducts();
        setShowProductDialog(false);
        resetProductForm();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);
      if (error) {
        toast.error('Failed to create product');
      } else {
        toast.success('Product created');
        fetchProducts();
        setShowProductDialog(false);
        resetProductForm();
      }
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: '',
      title: '',
      description: '',
      price: '',
      category: 'mainline',
      available: true,
      images: [],
    });
  };

  // Coupon functions
  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.discount_value) {
      toast.error('Code and discount value are required');
      return;
    }

    setLoading(true);
    const couponData = {
      code: couponForm.code.toUpperCase(),
      discount_type: couponForm.discount_type,
      discount_value: parseFloat(couponForm.discount_value),
      min_purchase: couponForm.min_purchase ? parseFloat(couponForm.min_purchase) : 0,
      max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : null,
      expires_at: couponForm.expires_at || null,
      active: true,
    };

    if (couponForm.id) {
      const { error } = await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', couponForm.id);
      if (!error) {
        toast.success('Coupon updated');
        fetchCoupons();
        setShowCouponDialog(false);
        resetCouponForm();
      }
    } else {
      const { error } = await supabase
        .from('coupons')
        .insert(couponData);
      if (!error) {
        toast.success('Coupon created');
        fetchCoupons();
        setShowCouponDialog(false);
        resetCouponForm();
      }
    }
    setLoading(false);
  };

  const handleToggleCoupon = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ active: !active }).eq('id', id);
    fetchCoupons();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
  };

  const resetCouponForm = () => {
    setCouponForm({
      id: '',
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_uses: '',
      expires_at: '',
    });
  };

  // Settings functions
  const handleQRUpload = async (file: File) => {
    setLoading(true);
    const fileName = `qr_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error } = await supabase.storage
      .from('payment-qr')
      .upload(fileName, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from('payment-qr')
        .getPublicUrl(fileName);
      
      await supabase
        .from('settings')
        .upsert({ key: 'payment_qr', value: urlData.publicUrl });
      
      setPaymentQR(urlData.publicUrl);
      toast.success('Payment QR uploaded');
    }
    setLoading(false);
  };

  // Order functions
  const handleUpdateOrderStatus = async (orderId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (!error) {
      toast.success(`Order ${status}`);
      fetchOrders();
      setSelectedOrder(null);
    }
  };

  // Analytics data
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  const totalRevenue = orders
    .filter(o => o.status === 'accepted')
    .reduce((sum, o) => sum + o.total, 0);

  const categoryData = [
    { name: 'Mainline', value: products.filter(p => p.category === 'mainline').length },
    { name: 'Premium', value: products.filter(p => p.category === 'premium').length },
    { name: 'Treasure Hunts', value: products.filter(p => p.category === 'treasure-hunts').length },
    { name: 'Vintage', value: products.filter(p => p.category === 'vintage').length },
  ];

  const COLORS = ['#E41B17', '#FF6B00', '#22c55e', '#C0C0C0'];

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-card-hover border border-border p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent-gradient rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="font-display text-2xl">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Enter password to continue</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button variant="hero" size="lg" className="w-full" onClick={handleLogin}>
              Access Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center">
              <span className="text-accent-foreground font-display text-lg">Z</span>
            </div>
            <div>
              <h1 className="font-display text-xl text-primary-foreground">Admin Dashboard</h1>
              <p className="text-secondary-foreground/60 text-sm">ZoomZone.Cars</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => {
              sessionStorage.removeItem('admin_auth');
              setIsAuthenticated(false);
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {!loading && (
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl">
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                <Package className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="coupons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                <Tag className="w-4 h-4 mr-2" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-6">
                  <p className="text-muted-foreground text-sm">Total Orders</p>
                  <p className="font-display text-3xl text-foreground">{orderStats.total}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <p className="text-muted-foreground text-sm">Pending</p>
                  <p className="font-display text-3xl text-warning">{orderStats.pending}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <p className="text-muted-foreground text-sm">Accepted</p>
                  <p className="font-display text-3xl text-success">{orderStats.accepted}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <p className="text-muted-foreground text-sm">Revenue</p>
                  <p className="font-display text-3xl text-primary">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg mb-4">Products by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg mb-4">Order Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: orderStats.pending },
                          { name: 'Accepted', value: orderStats.accepted },
                          { name: 'Rejected', value: orderStats.rejected },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell fill="#eab308" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-2xl">Products ({products.length})</h2>
                <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                  <DialogTrigger asChild>
                    <Button variant="hero" onClick={() => resetProductForm()}>
                      <Plus className="w-4 h-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">
                        {productForm.id ? 'Edit Product' : 'Add Product'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={productForm.title}
                          onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                          placeholder="Product title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Product description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price (₹) *</Label>
                          <Input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={productForm.category}
                            onValueChange={(value: Product['category']) => 
                              setProductForm({ ...productForm, category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mainline">Mainline</SelectItem>
                              <SelectItem value="premium">Premium / Real Riders</SelectItem>
                              <SelectItem value="treasure-hunts">Treasure Hunts</SelectItem>
                              <SelectItem value="vintage">Vintage / Redlines</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Images</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-4">
                          {productForm.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {productForm.images.map((img, i) => (
                                <div key={i} className="relative">
                                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                  <button
                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                                    onClick={() => setProductForm({
                                      ...productForm,
                                      images: productForm.images.filter((_, idx) => idx !== i)
                                    })}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <label className="cursor-pointer flex flex-col items-center">
                            {uploadingImages ? (
                              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-muted-foreground text-sm">Click to upload images</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => e.target.files && handleProductImageUpload(e.target.files)}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="available"
                          checked={productForm.available}
                          onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                        />
                        <Label htmlFor="available">Available for purchase</Label>
                      </div>
                      <Button variant="hero" className="w-full" onClick={handleSaveProduct}>
                        {productForm.id ? 'Update Product' : 'Create Product'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                    <p className="text-primary font-display text-lg">₹{product.price.toLocaleString('en-IN')}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setProductForm({
                            id: product.id,
                            title: product.title,
                            description: product.description || '',
                            price: product.price.toString(),
                            category: product.category,
                            available: product.available,
                            images: product.images || [],
                          });
                          setShowProductDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Coupons Tab */}
            <TabsContent value="coupons" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-2xl">Coupons ({coupons.length})</h2>
                <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                  <DialogTrigger asChild>
                    <Button variant="hero" onClick={() => resetCouponForm()}>
                      <Plus className="w-4 h-4" />
                      Add Coupon
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">
                        {couponForm.id ? 'Edit Coupon' : 'Add Coupon'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Code *</Label>
                        <Input
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                          placeholder="SAVE20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={couponForm.discount_type}
                            onValueChange={(value: 'percentage' | 'fixed') => 
                              setCouponForm({ ...couponForm, discount_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Value *</Label>
                          <Input
                            type="number"
                            value={couponForm.discount_value}
                            onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Min. Purchase (₹)</Label>
                          <Input
                            type="number"
                            value={couponForm.min_purchase}
                            onChange={(e) => setCouponForm({ ...couponForm, min_purchase: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Uses</Label>
                          <Input
                            type="number"
                            value={couponForm.max_uses}
                            onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                            placeholder="Unlimited"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input
                          type="datetime-local"
                          value={couponForm.expires_at}
                          onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                        />
                      </div>
                      <Button variant="hero" className="w-full" onClick={handleSaveCoupon}>
                        {couponForm.id ? 'Update Coupon' : 'Create Coupon'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{coupon.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${coupon.active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {coupon.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                        {coupon.min_purchase > 0 && ` on min. ₹${coupon.min_purchase}`}
                        {coupon.max_uses && ` • ${coupon.used_count}/${coupon.max_uses} used`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCoupon(coupon.id, coupon.active)}
                      >
                        {coupon.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCouponForm({
                            id: coupon.id,
                            code: coupon.code,
                            discount_type: coupon.discount_type,
                            discount_value: coupon.discount_value.toString(),
                            min_purchase: coupon.min_purchase?.toString() || '',
                            max_uses: coupon.max_uses?.toString() || '',
                            expires_at: coupon.expires_at || '',
                          });
                          setShowCouponDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <h2 className="font-display text-2xl">Orders ({orders.length})</h2>

              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-mono font-bold">{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-muted-foreground text-sm">{order.customer_name}</p>
                        <p className="text-muted-foreground text-sm">{order.customer_email}</p>
                        <p className="text-muted-foreground text-sm">{order.customer_phone}</p>
                      </div>
                      <div className={`
                        px-4 py-2 rounded-full border capitalize font-semibold
                        ${order.status === 'pending' ? 'bg-warning/20 text-warning border-warning/30' : ''}
                        ${order.status === 'accepted' ? 'bg-success/20 text-success border-success/30' : ''}
                        ${order.status === 'rejected' ? 'bg-destructive/20 text-destructive border-destructive/30' : ''}
                      `}>
                        {order.status}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-4">
                      {order.items.map((item: any, i: number) => (
                        <span key={i}>
                          {item.product?.title} x{item.quantity}
                          {i < order.items.length - 1 && ', '}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="font-display text-xl text-primary">
                        ₹{order.total.toLocaleString('en-IN')}
                      </p>
                      <div className="flex gap-2">
                        {order.payment_screenshot && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Payment Screenshot</DialogTitle>
                              </DialogHeader>
                              <img 
                                src={order.payment_screenshot} 
                                alt="Payment" 
                                className="w-full rounded-lg"
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                        {order.status === 'pending' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <h2 className="font-display text-2xl">Settings</h2>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg mb-4">Payment QR Code</h3>
                <div className="flex flex-col items-center gap-4">
                  {paymentQR ? (
                    <img 
                      src={paymentQR} 
                      alt="Payment QR" 
                      className="w-64 h-64 object-contain border border-border rounded-lg"
                    />
                  ) : (
                    <div className="w-64 h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No QR uploaded</p>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <Button variant="chrome" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {paymentQR ? 'Update QR' : 'Upload QR'}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleQRUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Admin;
