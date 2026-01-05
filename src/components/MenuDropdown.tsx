import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, HelpCircle, MapPin, Bell, LogOut, Settings, Trophy, Camera, Video, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './ui/badge';

interface MenuDropdownProps {
  onNavigate: (page: string) => void;
  category?: 'sports' | 'events' | 'parties' | 'gaming';
  unreadNotifications?: number;
  userName?: string;
}

export function MenuDropdown({ 
  onNavigate, 
  category = 'sports',
  unreadNotifications = 0,
  userName = 'User'
}: MenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const menuItems = [
    {
      icon: Trophy,
      label: 'Events',
      action: () => {
        setIsOpen(false);
        if (category === 'sports') onNavigate('sports-events');
        else if (category === 'events') onNavigate('events-events');
        else if (category === 'parties') onNavigate('party-events');
        else if (category === 'gaming') onNavigate('gaming-events');
      },
      color: 'text-yellow-600',
      bgColor: 'hover:bg-yellow-50',
    },
    {
      icon: Camera,
      label: 'Photos',
      action: () => {
        setIsOpen(false);
        if (category === 'sports') onNavigate('sports-photos');
        else if (category === 'events') onNavigate('events-photos');
        else if (category === 'parties') onNavigate('party-photos');
        else if (category === 'gaming') onNavigate('gaming-photos');
      },
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
    },
    {
      icon: Video,
      label: 'Highlights',
      action: () => {
        setIsOpen(false);
        if (category === 'sports') onNavigate('sports-highlights');
        else if (category === 'events') onNavigate('events-highlights');
        else if (category === 'parties') onNavigate('party-highlights');
        else if (category === 'gaming') onNavigate('gaming-highlights');
      },
      color: 'text-red-600',
      bgColor: 'hover:bg-red-50',
    },
    {
      icon: Heart,
      label: 'Memories',
      action: () => {
        setIsOpen(false);
        if (category === 'sports') onNavigate('sports-memories');
        else if (category === 'events') onNavigate('events-memories');
        else if (category === 'parties') onNavigate('party-memories');
        else if (category === 'gaming') onNavigate('gaming-memories');
      },
      color: 'text-pink-600',
      bgColor: 'hover:bg-pink-50',
    },
    {
      icon: Bell,
      label: 'Notifications',
      badge: unreadNotifications,
      action: () => {
        setIsOpen(false);
        // Notifications handled inline in header now, but can navigate to notification page
      },
      color: 'text-cyan-600',
      bgColor: 'hover:bg-cyan-50',
    },
    {
      icon: MapPin,
      label: 'Map View',
      action: () => {
        setIsOpen(false);
        onNavigate('map-view');
      },
      color: 'text-emerald-600',
      bgColor: 'hover:bg-emerald-50',
    },
    {
      icon: User,
      label: 'My Profile',
      action: () => {
        setIsOpen(false);
        if (category === 'sports') onNavigate('profile');
        else if (category === 'events') onNavigate('events-profile');
        else if (category === 'parties') onNavigate('parties-profile');
        else if (category === 'gaming') onNavigate('gaming-profile');
      },
      color: 'text-purple-600',
      bgColor: 'hover:bg-purple-50',
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      action: () => {
        setIsOpen(false);
        onNavigate('help');
      },
      color: 'text-orange-600',
      bgColor: 'hover:bg-orange-50',
    },
    {
      icon: Settings,
      label: 'Settings',
      action: () => {
        setIsOpen(false);
        // Add settings page navigation when ready
      },
      color: 'text-slate-600',
      bgColor: 'hover:bg-slate-50',
    },
  ];

  const getGradient = () => {
    switch (category) {
      case 'sports':
        return 'from-cyan-500 to-emerald-500';
      case 'events':
        return 'from-purple-500 to-pink-500';
      case 'parties':
        return 'from-pink-500 to-orange-500';
      case 'gaming':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-cyan-500 to-emerald-500';
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 hover:bg-slate-100 rounded-lg transition-all ${
          isOpen ? 'bg-slate-100' : ''
        }`}
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-slate-700" />
        ) : (
          <Menu className="w-6 h-6 text-slate-700" />
        )}
        
        {/* Notification Badge on Menu Icon */}
        {unreadNotifications > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs text-white">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          </motion.div>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
            style={{ backgroundColor: 'white' }}
          >
            {/* User Header */}
            <div className={`p-4 bg-gradient-to-r ${getGradient()} text-white`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white">{userName}</h3>
                  <p className="text-xs text-white/80">
                    {category === 'sports' && 'Sports Enthusiast'}
                    {category === 'events' && 'Culture Lover'}
                    {category === 'parties' && 'Social Butterfly'}
                    {category === 'gaming' && 'Gaming Legend'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2 bg-white">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.action}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-black ${item.bgColor}`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 text-left text-black">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge className="bg-red-500 text-white text-xs border-0">
                        {item.badge > 9 ? '9+' : item.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-3 bg-slate-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Handle logout
                  console.log('Logout clicked');
                }}
                className="w-full px-4 py-2.5 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
