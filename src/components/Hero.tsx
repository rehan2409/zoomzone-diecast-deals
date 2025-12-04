import { Zap, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-hero-gradient min-h-[70vh] flex items-center">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full blur-2xl animate-float" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-accent/20 rounded-full blur-2xl animate-float" />
        
        {/* Racing stripes */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-1 h-full bg-chrome-shine transform -skew-x-12" />
          <div className="absolute top-0 left-1/3 w-2 h-full bg-chrome-shine transform -skew-x-12" />
          <div className="absolute top-0 right-1/4 w-1 h-full bg-chrome-shine transform skew-x-12" />
          <div className="absolute top-0 right-1/3 w-2 h-full bg-chrome-shine transform skew-x-12" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-secondary/50" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-8 animate-fade-in-up">
            <Star className="w-4 h-4 text-accent" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              Premium Die-Cast Collectibles
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-primary-foreground mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            ZoomZone<span className="text-accent">.Cars</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Your Destination for Die-Cast Treasures
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              variant="hero" 
              size="xl" 
              onClick={scrollToProducts}
              className="group"
            >
              <Zap className="w-5 h-5 group-hover:animate-pulse" />
              Explore Collection
            </Button>
            <Button 
              variant="chrome" 
              size="xl"
              onClick={scrollToProducts}
            >
              <Trophy className="w-5 h-5" />
              Treasure Hunts
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl text-accent">500+</div>
              <div className="text-primary-foreground/60 text-sm mt-1">Models</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl text-accent">100%</div>
              <div className="text-primary-foreground/60 text-sm mt-1">Authentic</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl text-accent">1000+</div>
              <div className="text-primary-foreground/60 text-sm mt-1">Collectors</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
