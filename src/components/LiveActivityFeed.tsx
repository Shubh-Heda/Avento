import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, MapPin, Clock, Zap, Radio } from 'lucide-react';
import { Badge } from './ui/badge';

interface LiveActivity {
  id: string;
  type: 'match' | 'event' | 'party';
  title: string;
  location: string;
  participants: number;
  distance: string;
  startedAt: string;
  category: string;
}

interface LiveActivityFeedProps {
  category?: 'sports' | 'events' | 'parties' | 'all';
}

export function LiveActivityFeed({ category = 'all' }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<LiveActivity[]>([
    {
      id: '1',
      type: 'match',
      title: 'Football Match in Progress',
      location: 'Sky Sports Arena',
      participants: 10,
      distance: '0.8 km',
      startedAt: '15 min ago',
      category: 'sports',
    },
    {
      id: '2',
      type: 'event',
      title: 'Poetry Slam Session',
      location: 'Culture Hub',
      participants: 24,
      distance: '1.2 km',
      startedAt: '5 min ago',
      category: 'events',
    },
    {
      id: '3',
      type: 'party',
      title: 'Rooftop DJ Night',
      location: 'Skybar Lounge',
      participants: 45,
      distance: '2.1 km',
      startedAt: '30 min ago',
      category: 'parties',
    },
    {
      id: '4',
      type: 'match',
      title: 'Cricket Practice Session',
      location: 'Green Fields',
      participants: 8,
      distance: '1.5 km',
      startedAt: '10 min ago',
      category: 'sports',
    },
  ]);

  const [newActivity, setNewActivity] = useState<LiveActivity | null>(null);

  // Filter activities by category
  const filteredActivities = category === 'all' 
    ? activities 
    : activities.filter(a => a.category === category);

  // Simulate new activity appearing
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivities: LiveActivity[] = [
        {
          id: Date.now().toString(),
          type: 'match',
          title: 'Badminton Match Starting',
          location: 'Indoor Arena',
          participants: 4,
          distance: '0.5 km',
          startedAt: 'just now',
          category: 'sports',
        },
        {
          id: Date.now().toString(),
          type: 'event',
          title: 'Art Gallery Opening',
          location: 'Modern Art Space',
          participants: 18,
          distance: '1.8 km',
          startedAt: 'just now',
          category: 'events',
        },
      ];

      const randomActivity = newActivities[Math.floor(Math.random() * newActivities.length)];
      setNewActivity(randomActivity);
      
      setTimeout(() => {
        // Keep only the latest 3 activities to prevent list churn
        setActivities(prev => [randomActivity, ...prev].slice(0, 3));
        setNewActivity(null);
      }, 3000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'match':
        return 'bg-cyan-50 text-cyan-700';
      case 'event':
        return 'bg-indigo-50 text-indigo-700';
      case 'party':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'match':
        return '⚽';
      case 'event':
        return '🎨';
      case 'party':
        return '🎉';
      default:
        return '📍';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            What's Happening Now?
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Live updates
        </span>
      </div>

      {/* New activity popup */}
      <AnimatePresence>
        {newActivity && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-4"
          >
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <div className="p-4 flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">New activity started</p>
                  <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">{newActivity.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {newActivity.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {newActivity.participants}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity list */}
      <div className="space-y-3">
        {filteredActivities.slice(0, 3).map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <div className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${getTypeColor(activity.type)}`}>
                  {getTypeIcon(activity.type)}
                </div>
                
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">{activity.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {activity.participants}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">{activity.distance} away</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <Badge className="bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.startedAt}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
