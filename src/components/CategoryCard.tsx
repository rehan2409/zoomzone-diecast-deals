import { Car, Crown, Gem, Clock } from 'lucide-react';
import { CategoryType } from '@/types';

interface CategoryCardProps {
  id: CategoryType;
  name: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

const iconMap = {
  mainline: Car,
  premium: Crown,
  'treasure-hunts': Gem,
  vintage: Clock,
  all: Car,
};

export function CategoryCard({ id, name, description, isActive, onClick }: CategoryCardProps) {
  const Icon = iconMap[id] || Car;

  return (
    <button
      onClick={onClick}
      className={`
        relative group p-6 rounded-xl border-2 transition-all duration-300
        ${isActive 
          ? 'bg-accent-gradient border-accent shadow-card-hover' 
          : 'bg-card border-border hover:border-primary/50 hover:shadow-card'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300
        ${isActive 
          ? 'bg-accent-foreground/20' 
          : 'bg-primary/10 group-hover:bg-primary/20'
        }
      `}>
        <Icon className={`
          w-7 h-7 transition-colors duration-300
          ${isActive ? 'text-accent-foreground' : 'text-primary'}
        `} />
      </div>

      {/* Content */}
      <h3 className={`
        font-display text-lg mb-2 transition-colors duration-300
        ${isActive ? 'text-accent-foreground' : 'text-foreground'}
      `}>
        {name}
      </h3>
      <p className={`
        text-sm transition-colors duration-300
        ${isActive ? 'text-accent-foreground/80' : 'text-muted-foreground'}
      `}>
        {description}
      </p>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-accent-foreground rounded-full animate-pulse" />
      )}

      {/* Hover effect */}
      <div className={`
        absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none
        ${isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
      `}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl" />
      </div>
    </button>
  );
}
