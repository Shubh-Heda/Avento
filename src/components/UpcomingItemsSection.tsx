import { Calendar, MapPin, Users, MessageCircle, CreditCard, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MatchCountdownTimer } from './MatchCountdownTimer';
import { EmptyState } from './EmptyState';

interface UpcomingItem {
  id: string;
  title: string;
  venueName: string;
  date: string;
  time: string;
  category: string;
  status: 'upcoming' | 'completed';
  amount?: number;
  location?: string;
  participants?: number;
  maxParticipants?: number;
  image?: string;
}

interface UpcomingItemsSectionProps {
  items: UpcomingItem[];
  category: 'sports' | 'gaming' | 'events' | 'party' | 'coaching';
  onNavigateToChat?: (itemId: string) => void;
  onNavigateToFind?: () => void;
  onNavigateToCreate?: () => void;
  onPayNow?: (item: UpcomingItem) => void;
  sectionTitle?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  findLabel?: string;
  createLabel?: string;
  showActions?: boolean;
}

export function UpcomingItemsSection({
  items,
  category,
  onNavigateToChat,
  onNavigateToFind,
  onNavigateToCreate,
  onPayNow,
  sectionTitle,
  emptyStateTitle,
  emptyStateDescription,
  findLabel,
  createLabel,
  showActions = true
}: UpcomingItemsSectionProps) {
  // Get only upcoming items
  const upcomingItems = items.filter(item => item.status === 'upcoming');

  // Default texts based on category
  const getCategoryDefaults = () => {
    switch(category) {
      case 'sports':
        return {
          sectionTitle: 'Your Upcoming Matches',
          emptyTitle: 'No upcoming matches yet',
          emptyDescription: 'Ready to make new friends? Join a match or create one to get started! Every game is a chance to build connections. ⚽',
          findLabel: 'Find Matches',
          createLabel: 'Create Match',
          icon: '⚽',
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop'
        };
      case 'gaming':
        return {
          sectionTitle: 'Your Upcoming Sessions',
          emptyTitle: 'No gaming sessions scheduled',
          emptyDescription: 'Ready to squad up? Find gaming sessions at your favorite cafes or create your own! 🎮',
          findLabel: 'Find Sessions',
          createLabel: 'Create Session',
          icon: '🎮',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop'
        };
      case 'events':
        return {
          sectionTitle: 'Your Upcoming Events',
          emptyTitle: 'No events booked yet',
          emptyDescription: 'Discover amazing cultural experiences! Browse events or create your own gathering. 🎭',
          findLabel: 'Find Events',
          createLabel: 'Create Event',
          icon: '🎭',
          image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop'
        };
      case 'party':
        return {
          sectionTitle: 'Your Upcoming Parties',
          emptyTitle: 'No parties planned yet',
          emptyDescription: 'Time to celebrate! Find parties to join or plan your own amazing celebration! 🎉',
          findLabel: 'Find Parties',
          createLabel: 'Create Party',
          icon: '🎉',
          image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop'
        };
      case 'coaching':
        return {
          sectionTitle: 'Your Upcoming Sessions',
          emptyTitle: 'No coaching sessions booked',
          emptyDescription: 'Ready to improve? Find the perfect coach or schedule your next training session! 🎓',
          findLabel: 'Find Coaches',
          createLabel: 'Book Session',
          icon: '🎓',
          image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop'
        };
    }
  };

  const defaults = getCategoryDefaults();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-600" />
          <h2>{sectionTitle || defaults.sectionTitle}</h2>
        </div>
      </div>

      {/* Countdown Timer for Next Item */}
      {upcomingItems.length > 0 && upcomingItems[0] && (
        <div className="mb-4">
          <MatchCountdownTimer
            matchDate={upcomingItems[0].date}
            matchTime={upcomingItems[0].time}
            matchTitle={upcomingItems[0].title}
            showDismiss={true}
          />
        </div>
      )}

      {/* Always show action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button
          onClick={onNavigateToFind}
          className="h-16 w-full justify-start px-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl"
        >
          <span className="text-2xl mr-3">🔍</span>
          {findLabel || defaults.findLabel}
        </Button>
        <Button
          onClick={onNavigateToCreate}
          className="h-16 w-full justify-start px-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
        >
          <span className="text-2xl mr-3">✨</span>
          {createLabel || defaults.createLabel}
        </Button>
      </div>

      {upcomingItems.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={emptyStateTitle || defaults.emptyTitle}
          description={emptyStateDescription || defaults.emptyDescription}
          actionLabel={findLabel || defaults.findLabel}
          onAction={onNavigateToFind}
          secondaryActionLabel={createLabel || defaults.createLabel}
          onSecondaryAction={onNavigateToCreate}
        />
      ) : (
        <div className="space-y-4">
          {upcomingItems.map(item => (
            <div 
              key={item.id} 
              className="flex items-start gap-4 p-4 bg-black rounded-xl border border-slate-700 hover:shadow-md transition-shadow"
            >
              <ImageWithFallback 
                src={item.image || defaults.image}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-lg shadow-md flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-white font-semibold">{item.title}</h3>
                    <p className="text-slate-300 truncate">{item.venueName}{item.location ? ` • ${item.location}` : ''}</p>
                  </div>
                  <Badge className="bg-cyan-500 text-white flex-shrink-0">{item.category}</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-200 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {item.date}, {item.time}
                  </span>
                  {item.participants !== undefined && item.maxParticipants !== undefined && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {item.participants}/{item.maxParticipants} {category === 'coaching' ? 'students' : 'players'}
                    </span>
                  )}
                  {item.amount && (
                    <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                      <CreditCard className="w-4 h-4" />
                      ₹{item.amount}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 border-2 border-slate-600 flex items-center justify-center text-xs text-white shadow-md">S</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 border-2 border-slate-600 flex items-center justify-center text-xs text-white shadow-md">M</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 border-2 border-slate-600 flex items-center justify-center text-xs text-white shadow-md">R</div>
                    </div>
                    <span className="text-sm text-slate-200">Friends attending</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onNavigateToChat && (
                      <Button
                        onClick={() => onNavigateToChat(item.id)}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </Button>
                    )}
                    {item.amount && onPayNow && (
                      <Button
                        onClick={() => onPayNow(item)}
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
