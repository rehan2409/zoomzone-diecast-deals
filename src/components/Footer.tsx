import { Car, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center">
                <span className="text-accent-foreground font-display text-lg">Z</span>
              </div>
              <span className="font-display text-2xl text-primary">ZoomZone.Cars</span>
            </div>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
              Your ultimate destination for premium die-cast collectibles. 
              From rare Treasure Hunts to classic Redlines, we've got your collection covered.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-display text-lg text-primary">Categories</h3>
            <ul className="space-y-2 text-secondary-foreground/70">
              <li className="hover:text-primary transition-colors cursor-pointer">Mainline</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Premium / Real Riders</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Treasure Hunts</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Vintage / Redlines</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-display text-lg text-primary">Contact Us</h3>
            <ul className="space-y-3 text-secondary-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                <span>contact@zoomzone.cars</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <span>Mumbai, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-secondary-foreground/50 text-sm">
              © {new Date().getFullYear()} ZoomZone.Cars. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-secondary-foreground/50 text-sm">
              <Car className="w-4 h-4 text-primary" />
              <span>Die-Cast Collectibles for Enthusiasts</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
