import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, ArrowLeft, MapPin, Star, Clock, Users, Filter, Search, Plus,
  Zap, Trophy, Target, Wifi, UtensilsCrossed, Video, DoorOpen,
  TrendingUp, Shield, Heart, MessageCircle, ChevronRight, X,
  Calendar, Timer, Joystick, Monitor, Headphones, Sparkles,
  Home, User as UserIcon, MessageSquare, HelpCircle, Menu,
  Bell, Wallet, Award, Flame, TrendingDown, CheckCircle,
  Gift, Camera, Share2, Mail, ChevronDown, ArrowUpRight,
  Settings, Edit, LogOut, CreditCard, History, BarChart3
} from 'lucide-react';
import { gamingService, GamingClub, GamingSession } from '../services/gamingService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { AventoLogo } from './AventoLogo';
import { CreateGamingSessionModal } from './CreateGamingSessionModal';
import { GamingSessionCard } from './GamingSessionCard';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { GlobalSearch } from './GlobalSearch';
import { NotificationInbox } from './NotificationInbox';
import { MenuDropdown } from './MenuDropdown';

interface GamingHubProps {
  onNavigate: (page: string) => void;
}

export function GamingHub({ onNavigate }: GamingHubProps) {
  console.log('🎮🎮🎮 GAMING HUB COMPONENT IS RENDERING! 🎮🎮🎮');
  
  const userId = 'user_001';
  const [userName, setUserName] = useState('Alex Thompson');
  const [userBio, setUserBio] = useState('Pro gamer | FIFA Champion | Making friends through gaming 🎮');
  const [favoriteGames, setFavoriteGames] = useState(['FIFA 24', 'Valorant', 'COD MW3']);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'home' | 'clubs' | 'sessions' | 'tournaments' | 'profile'>('home');
  const [gamingClubs, setGamingClubs] = useState<GamingClub[]>([]);
  const [gamingSessions, setGamingSessions] = useState<GamingSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<GamingClub | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterGame, setFilterGame] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    loadData();
    gamingService.initMockTournaments();
  }, []);

  const loadData = () => {
    setGamingClubs(gamingService.getGamingClubs());
    setGamingSessions(gamingService.getGamingSessions());
  };

  const popularGames = [
    { name: 'FIFA 24', icon: '⚽', color: 'from-green-500 to-emerald-500' },
    { name: 'COD: MW3', icon: '🎯', color: 'from-orange-500 to-red-500' },
    { name: 'Valorant', icon: '🔫', color: 'from-red-500 to-pink-500' },
    { name: 'GTA V', icon: '🚗', color: 'from-purple-500 to-indigo-500' },
    { name: 'Fortnite', icon: '🎮', color: 'from-blue-500 to-cyan-500' },
    { name: 'Apex Legends', icon: '⚡', color: 'from-yellow-500 to-orange-500' }
  ];

  const filteredClubs = gamingClubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFacilityIcon = (facility: string) => {
    if (facility.includes('Food') || facility.includes('Drinks')) return UtensilsCrossed;
    if (facility.includes('Streaming')) return Video;
    if (facility.includes('Private')) return DoorOpen;
    if (facility.includes('WiFi')) return Wifi;
    return Sparkles;
  };

  // Mock data for features
  const userStats = {
    trustScore: 4.7,
    friendshipStreak: 15,
    totalGames: 48,
    wins: 32,
    achievements: 12,
    coins: 2450,
    level: 18,
    hoursPlayed: 156,
    friendsMade: 24
  };

  const achievements = [
    { id: 1, title: 'First Win', description: 'Won your first game', icon: '🏆', unlocked: true, date: '2024-01-15', coins: 50 },
    { id: 2, title: 'Team Player', description: 'Played 10 team matches', icon: '👥', unlocked: true, date: '2024-02-01', coins: 100 },
    { id: 3, title: 'Winning Streak', description: 'Won 5 games in a row', icon: '🔥', unlocked: true, date: '2024-02-10', coins: 150 },
    { id: 4, title: 'Tournament Champion', description: 'Win a tournament', icon: '👑', unlocked: false, date: null, coins: 500 },
    { id: 5, title: 'Social Gamer', description: 'Make 20 gaming friends', icon: '💫', unlocked: true, date: '2024-03-01', coins: 200 },
    { id: 6, title: 'Legendary', description: 'Reach level 50', icon: '⭐', unlocked: false, date: null, coins: 1000 }
  ];

  const notifications = [
    { id: 1, text: 'New gaming session at GameZone!', time: '5m ago', type: 'session', unread: true },
    { id: 2, text: 'You earned the Team Player badge!', time: '1h ago', type: 'achievement', unread: true },
    { id: 3, text: 'Tournament registration closing soon', time: '2h ago', type: 'tournament', unread: false },
    { id: 4, text: 'Friend request from @gamer_pro', time: '3h ago', type: 'social', unread: true }
  ];

  const recentMatches = [
    { game: 'FIFA 24', result: 'Win', score: '3-1', date: 'Today', opponent: 'Team Alpha', coins: 50 },
    { game: 'Valorant', result: 'Loss', score: '11-13', date: 'Yesterday', opponent: 'Team Beta', coins: 0 },
    { game: 'COD MW3', result: 'Win', score: '150-120', date: '2 days ago', opponent: 'Team Gamma', coins: 50 }
  ];

  const transactionHistory = [
    { id: 1, type: 'earn', description: 'Won FIFA Tournament', amount: 200, date: 'Today', icon: '🏆' },
    { id: 2, type: 'spend', description: 'Booked Private Room', amount: -150, date: 'Yesterday', icon: '🎮' },
    { id: 3, type: 'earn', description: 'Achievement Unlocked', amount: 100, date: '2 days ago', icon: '⭐' },
    { id: 4, type: 'earn', description: 'Daily Login Bonus', amount: 50, date: '3 days ago', icon: '🎁' },
    { id: 5, type: 'spend', description: 'Tournament Entry Fee', amount: -100, date: '4 days ago', icon: '🎯' }
  ];

  const handleProfileSave = () => {
    toast.success('Profile updated successfully! 🎮');
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 bg-white">
      
      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('landing')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:text-purple-600 transition-colors" />
              </button>
              <AventoLogo size="md" variant="with-text" />
            </div>

            {/* Middle Navigation Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('gaming-community')}
                className="gap-2 hover:bg-purple-50"
              >
                <Users className="w-4 h-4" />
                Community
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('gaming-events')}
                className="gap-2 hover:bg-yellow-50"
              >
                <Trophy className="w-4 h-4" />
                Events
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('gaming-chat')}
                className="gap-2 hover:bg-cyan-50"
              >
                <MessageCircle className="w-4 h-4" />
                Chats
              </Button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Global Search */}
              <GlobalSearch placeholder="Search games, clubs, players..." />

              {/* Coins Display */}
              <button
                onClick={() => setShowWalletModal(true)}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-full border border-yellow-500/30 hover:scale-105 transition-transform"
              >
                <Wallet className="w-4 h-4 text-yellow-600" />
                <span className="text-slate-800">{userStats.coins}</span>
              </button>

              {/* Notifications */}
              <NotificationInbox />

              {/* Menu Dropdown */}
              <MenuDropdown 
                onNavigate={onNavigate} 
                category="gaming"
                unreadNotifications={0}
                userName="Gamer"
              />
            </div>
          </div>
        </div>
      </header>

      {/* HERO IMAGE SECTION - Like Other Dashboards */}
      <div className="relative h-[400px] overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1751759195549-453a9103e383?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNhZGUlMjBnYW1pbmclMjBuZW9ufGVufDF8fHx8MTc2NDg3NTAzOXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Gaming Arcade Hub"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-black/50 to-pink-900/70" />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-white mb-4">Welcome back, {userName}! 🎮</h1>
              <p className="text-xl text-white/90 mb-6">Level up your gaming experience and make lasting friendships</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl text-lg px-8 py-6"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Create Gaming Session
                </Button>
                <Button
                  onClick={() => setActiveTab('tournaments')}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-2 border-white/30 shadow-xl text-lg px-8 py-6"
                >
                  <Trophy className="w-6 h-6 mr-2" />
                  Join Tournament
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Level Badge */}
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-full px-6 py-3 shadow-xl border border-white/50">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-xs text-slate-600">Your Level</p>
              <p className="text-xl text-slate-800">{userStats.level}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="absolute bottom-6 left-6 flex flex-wrap gap-3">
          <div className="bg-white/90 backdrop-blur-md rounded-full px-5 py-2 shadow-lg border border-white/50 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600" />
            <span className="text-slate-800">Trust: {userStats.trustScore}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-full px-5 py-2 shadow-lg border border-white/50 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="text-slate-800">{userStats.friendshipStreak} streak</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-full px-5 py-2 shadow-lg border border-white/50 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-yellow-600" />
            <span className="text-slate-800">{userStats.coins} coins</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Welcome Section with Stats */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Welcome back, {userName}! 🎮</h1>
                  <p className="text-slate-600">Ready to level up your gaming experience?</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-full shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                  <div>
                    <p className="text-xs text-white/80">Level</p>
                    <p className="text-white">{userStats.level}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Trust Score */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border border-cyan-200 cursor-pointer shadow-md hover:shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Decorative Background Element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-300/5 to-blue-300/5 rounded-full -ml-8 -mb-8" />
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-cyan-700 text-sm mb-1 font-semibold">Trust Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-800 text-xl font-bold">{userStats.trustScore}</span>
                    <span className="text-cyan-600 text-sm">/5.0</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-cyan-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"
                      style={{ width: `${(userStats.trustScore / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-cyan-600 mt-2">⭐ Excellent Standing</p>
                </motion.div>

                {/* Friendship Streak */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200 cursor-pointer shadow-md hover:shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Decorative Background Element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-orange-300/5 to-red-300/5 rounded-full -ml-8 -mb-8" />
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-orange-700 text-sm mb-1 font-semibold relative z-10">Friendship Streak</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-slate-800 text-xl font-bold">{userStats.friendshipStreak}</span>
                    <span className="text-orange-600 text-sm">sessions</span>
                  </div>
                  <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1 relative z-10">
                    <TrendingUp className="w-3 h-3" />
                    🔥 On Fire!
                  </p>
                </motion.div>

                {/* Win Rate */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 cursor-pointer shadow-md hover:shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Decorative Background Element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-green-300/5 to-emerald-300/5 rounded-full -ml-8 -mb-8" />
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-green-700 text-sm mb-1 font-semibold relative z-10">Win Rate</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-slate-800 text-xl font-bold">{Math.round((userStats.wins / userStats.totalGames) * 100)}%</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-2 relative z-10">📊 {userStats.wins}/{userStats.totalGames} games</p>
                </motion.div>

                {/* Achievements */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => setActiveTab('profile')}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200 cursor-pointer shadow-md hover:shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Decorative Background Element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-yellow-300/5 to-orange-300/5 rounded-full -ml-8 -mb-8" />
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-yellow-700 text-sm mb-1 font-semibold relative z-10">Achievements</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-slate-800 text-xl font-bold">{userStats.achievements}</span>
                    <span className="text-yellow-600 text-sm">unlocked</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-2 relative z-10">✨ Click to view all</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* My Profile Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('gaming-profile')}
                className="relative group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl p-6 shadow-lg text-white flex flex-col items-center justify-center gap-3 border border-purple-400/50 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-white/20 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <UserIcon className="w-8 h-8 relative z-10" />
                <span className="font-semibold text-center relative z-10">My Profile</span>
              </motion.button>

              {/* Community Feed Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('gaming-community')}
                className="relative group bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 rounded-2xl p-6 shadow-lg text-white flex flex-col items-center justify-center gap-3 border border-pink-400/50 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-white/20 to-pink-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Users className="w-8 h-8 relative z-10" />
                <span className="font-semibold text-center relative z-10">Community</span>
              </motion.button>

              {/* Squad Chat Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('gaming-chat')}
                className="relative group bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-2xl p-6 shadow-lg text-white flex flex-col items-center justify-center gap-3 border border-cyan-400/50 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <MessageSquare className="w-8 h-8 relative z-10" />
                <span className="font-semibold text-center relative z-10">Squad Chat</span>
              </motion.button>

              {/* Gaming Cafes Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('gaming-map')}
                className="relative group bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-2xl p-6 shadow-lg text-white flex flex-col items-center justify-center gap-3 border border-indigo-400/50 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-white/20 to-indigo-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <MapPin className="w-8 h-8 relative z-10" />
                <span className="font-semibold text-center relative z-10">Gaming Cafes</span>
              </motion.button>

              {/* Community Events Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('gaming-events')}
                className="relative group bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-2xl p-6 shadow-lg text-white flex flex-col items-center justify-center gap-3 border border-yellow-400/50 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-white/20 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Trophy className="w-8 h-8 relative z-10" />
                <span className="font-semibold text-center relative z-10">Events</span>
              </motion.button>
            </div>

            {/* Recent Activity & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Matches */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Recent Matches
                  </h3>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-3">
                  {recentMatches.map((match, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                    >
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700" />
                      
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            match.result === 'Win' 
                              ? 'bg-green-500/20 text-green-700 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-700 border border-red-500/30'
                          }`}>
                            {match.result === 'Win' ? '✓ ' : '✕ '}{match.result}
                          </div>
                          <span className="text-slate-800 font-medium">{match.game}</span>
                        </div>
                        <span className="text-slate-800 font-bold text-lg">{match.score}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm relative z-10">
                        <span className="text-slate-600">vs {match.opponent}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{match.date}</span>
                          {match.coins > 0 && (
                            <span className="text-yellow-600 flex items-center gap-1 font-semibold">
                              <Wallet className="w-3 h-3" />
                              +{match.coins}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Achievements Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Achievements
                  </h3>
                  <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                    {achievements.filter(a => a.unlocked).length}/{achievements.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center p-3 border cursor-pointer relative overflow-hidden transition-all ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 shadow-md'
                          : 'bg-slate-100 border-slate-300 opacity-50'
                      }`}
                    >
                      {achievement.unlocked && (
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-white/20 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      <span className="text-3xl mb-1 relative z-10 drop-shadow-lg">{achievement.icon}</span>
                      <p className="text-xs text-slate-800 text-center line-clamp-1 relative z-10 font-semibold">{achievement.title}</p>
                    </motion.div>
                  ))}
                </div>
                <Button 
                  onClick={() => setActiveTab('profile')}
                  className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
                >
                  View All Achievements ➜
                </Button>
              </motion.div>
            </div>

            {/* Active Tournaments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  Active Tournaments
                </h3>
                <Button 
                  onClick={() => setActiveTab('tournaments')}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-sm"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gamingService.getTournaments().slice(0, 2).map((tournament, idx) => (
                  <motion.div
                    key={tournament.id}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-xl p-4 border border-purple-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-lg relative overflow-hidden"
                  >
                    {/* Decorative corner element */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full -mr-12 -mt-12" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-pink-400/5 to-purple-400/5 rounded-full -ml-10 -mb-10" />
                    
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                        {tournament.game}
                      </Badge>
                      <span className="text-green-600 font-semibold">₹{tournament.prizePool.toLocaleString()}</span>
                    </div>
                    <h4 className="text-slate-800 mb-2 font-semibold relative z-10">{tournament.name}</h4>
                    <div className="flex items-center justify-between text-sm relative z-10">
                      <span className="text-slate-600">{tournament.currentTeams}/{tournament.maxTeams} teams</span>
                      <span className="text-cyan-600 font-medium">₹{tournament.registrationFee}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden relative z-10">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shadow-lg shadow-purple-500/50"
                        style={{ width: `${(tournament.currentTeams / tournament.maxTeams) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Popular Games */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
            >
              <h3 className="text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎮</span>
                Popular Games
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {popularGames.map((game, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.08, y: -8, rotate: 2 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setActiveTab('clubs')}
                    className={`aspect-square rounded-xl bg-gradient-to-r ${game.color} p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700" />
                    <span className="text-4xl drop-shadow-lg relative z-10">{game.icon}</span>
                    <span className="text-white text-xs text-center font-semibold relative z-10">{game.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* CLUBS TAB */}
        {activeTab === 'clubs' && (
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-slate-800 mb-2">Gaming Clubs</h1>
              <p className="text-slate-600">Find the perfect gaming club near you</p>
            </motion.div>

            {/* Search & Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gaming clubs..."
                  className="pl-10 bg-white/90 border-slate-300 text-slate-800 placeholder:text-slate-400 backdrop-blur-md shadow-sm"
                />
              </div>
              <Button className="bg-white/90 hover:bg-white text-slate-800 border border-slate-300 backdrop-blur-md shadow-sm">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </Button>
            </div>

            {/* Popular Games Quick Filter */}
            <div className="mb-6">
              <p className="text-sm text-slate-700 mb-3">Filter by Game</p>
              <div className="flex flex-wrap gap-2">
                {popularGames.map((game, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-xl bg-gradient-to-r ${game.color} text-white text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow`}
                  >
                    <span>{game.icon}</span>
                    <span>{game.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Gaming Clubs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedClub(club)}
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/50 hover:border-purple-300 transition-all shadow-lg hover:shadow-2xl">
                    {/* Club Image */}
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback 
                        src={club.image} 
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      
                      {/* Rating Badge */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-sm">{club.rating}</span>
                      </div>

                      {/* Hourly Rate */}
                      <div className="absolute bottom-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full">
                        <p className="text-white">₹{club.hourlyRate}/hr</p>
                      </div>
                    </div>

                    {/* Club Info */}
                    <div className="p-5">
                      <h3 className="text-slate-800 mb-2">{club.name}</h3>
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{club.location}</span>
                        <span className="text-slate-400">• {club.distance}</span>
                      </div>

                      {/* Consoles */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {club.consoles.map((console, i) => (
                          <Badge key={i} className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                            {console}
                          </Badge>
                        ))}
                      </div>

                      {/* Facilities */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {club.facilities.slice(0, 3).map((facility, i) => {
                          const Icon = getFacilityIcon(facility);
                          return (
                            <div key={i} className="flex items-center gap-1 text-xs text-slate-600">
                              <Icon className="w-3 h-3" />
                              <span>{facility}</span>
                            </div>
                          );
                        })}
                        {club.facilities.length > 3 && (
                          <span className="text-xs text-slate-500">+{club.facilities.length - 3} more</span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                        <div className="text-center">
                          <p className="text-slate-800 text-sm">{club.totalSeats}</p>
                          <p className="text-xs text-slate-500">Seats</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-800 text-sm">{club.privateRooms}</p>
                          <p className="text-xs text-slate-500">Rooms</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-800 text-sm">{club.streamingSetups}</p>
                          <p className="text-xs text-slate-500">Streaming</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-slate-800 mb-2">Gaming Sessions</h1>
                  <p className="text-slate-600">Join or create gaming sessions with friends</p>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Session
                </Button>
              </div>
            </motion.div>

            <div className="text-center py-20 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50">
              <Gamepad2 className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
              <p className="text-slate-600 mb-4">No active gaming sessions yet</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                Create First Session
              </Button>
            </div>
          </div>
        )}

        {/* TOURNAMENTS TAB */}
        {activeTab === 'tournaments' && (
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-slate-800 mb-2">Tournaments</h1>
              <p className="text-slate-600">Compete in exciting gaming tournaments</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gamingService.getTournaments().map((tournament, i) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, y: -8 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/50 hover:border-yellow-300 transition-all shadow-lg hover:shadow-2xl relative overflow-hidden group"
                >
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full -ml-12 -mb-12" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <h3 className="text-slate-800 mb-2 font-bold text-lg">{tournament.name}</h3>
                      <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                        {tournament.game}
                      </Badge>
                    </div>
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-4xl"
                    >
                      🏆
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-slate-500 mb-1">Prize Pool</p>
                      <p className="text-xl text-green-600 font-bold">₹{tournament.prizePool.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-3 border border-cyan-200">
                      <p className="text-xs text-slate-500 mb-1">Entry Fee</p>
                      <p className="text-xl text-slate-800 font-bold">₹{tournament.registrationFee}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 relative z-10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Teams Registered</span>
                      <span className="text-slate-800 font-bold">{tournament.currentTeams} / {tournament.maxTeams}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shadow-lg shadow-purple-500/50"
                        initial={{ width: 0 }}
                        animate={{ width: `${(tournament.currentTeams / tournament.maxTeams) * 100}%` }}
                        transition={{ duration: 1.5, delay: i * 0.2 }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 relative z-10">
                    <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                      <Users className="w-4 h-4" />
                      <span>{tournament.teamSize}v{tournament.teamSize}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg font-semibold relative z-10">
                    Register Now ⚡
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 relative overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full -mr-24 -mt-24" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-cyan-400/5 to-blue-400/5 rounded-full -ml-20 -mb-20" />
              
              <div className="flex items-start gap-6 relative z-10">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center text-white text-3xl shadow-lg border-4 border-white"
                  >
                    AT
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-purple-600" />
                  </motion.button>
                </div>
                <div className="flex-1 relative z-10">
                  {isEditingProfile ? (
                    <div className="space-y-3">
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-white border-slate-300"
                        placeholder="Your Name"
                      />
                      <Input
                        value={userBio}
                        onChange={(e) => setUserBio(e.target.value)}
                        className="bg-white border-slate-300"
                        placeholder="Your Bio"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleProfileSave} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                          💾 Save Changes
                        </Button>
                        <Button onClick={() => setIsEditingProfile(false)} className="bg-slate-200 text-slate-800">
                          ✕ Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-slate-800 text-2xl font-bold">{userName}</h1>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                          ⭐ Level {userStats.level}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-3">{userBio}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {favoriteGames.map((game, i) => (
                          <Badge key={i} className="bg-slate-200 text-slate-700 border-slate-300">
                            🎮 {game}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setIsEditingProfile(true)} className="bg-slate-800 hover:bg-slate-700 text-white text-sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 relative z-10">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200"
                >
                  <p className="text-3xl text-slate-800 mb-1 font-bold">{userStats.totalGames}</p>
                  <p className="text-sm text-slate-600">🎮 Games Played</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200"
                >
                  <p className="text-3xl text-slate-800 mb-1 font-bold">{userStats.hoursPlayed}</p>
                  <p className="text-sm text-slate-600">⏱️ Hours</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200"
                >
                  <p className="text-3xl text-slate-800 mb-1 font-bold">{userStats.friendsMade}</p>
                  <p className="text-sm text-slate-600">👥 Friends</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200"
                >
                  <p className="text-3xl text-slate-800 mb-1 font-bold">{userStats.coins}</p>
                  <p className="text-sm text-slate-600">💰 Coins</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Full Achievement List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
            >
              <h3 className="text-slate-800 mb-4 text-lg font-bold flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                All Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`rounded-xl p-4 border flex items-start gap-4 transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md hover:shadow-lg'
                        : 'bg-slate-50 border-slate-300 opacity-50'
                    }`}
                  >
                    <span className="text-5xl drop-shadow-lg">{achievement.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-slate-800 font-bold">{achievement.title}</h4>
                        {achievement.unlocked && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        {achievement.unlocked && achievement.date && (
                          <p className="text-xs text-slate-500">✓ Unlocked: {achievement.date}</p>
                        )}
                        <p className="text-xs text-yellow-600 flex items-center gap-1 font-semibold">
                          <Wallet className="w-3 h-3" />
                          {achievement.coins} coins
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trust Score Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
            >
              <h3 className="text-slate-800 mb-4 text-lg font-bold flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Trust Score Breakdown
              </h3>
              <div className="space-y-5">
                {[
                  { label: 'Match Completion', value: 95, color: 'from-green-500 to-emerald-500', icon: '✓' },
                  { label: 'Punctuality', value: 88, color: 'from-blue-500 to-cyan-500', icon: '⏱️' },
                  { label: 'Team Spirit', value: 92, color: 'from-purple-500 to-pink-500', icon: '👥' },
                  { label: 'Sportsmanship', value: 90, color: 'from-orange-500 to-yellow-500', icon: '🏅' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-800 font-semibold flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                      </span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                        className="text-slate-600 font-bold"
                      >
                        {item.value}%
                      </motion.span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <motion.div 
                        className={`h-full bg-gradient-to-r ${item.color} shadow-lg`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1.5, delay: i * 0.15, ease: "easeOut" }}
                        style={{ boxShadow: `0 0 20px rgba(${item.color === 'from-green-500 to-emerald-500' ? '16, 185, 129' : item.color === 'from-blue-500 to-cyan-500' ? '59, 130, 246' : item.color === 'from-purple-500 to-pink-500' ? '168, 85, 247' : '249, 115, 22'}, 0.5)` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'home' ? 'text-purple-600' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('clubs')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'clubs' ? 'text-purple-600' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Joystick className="w-6 h-6" />
              <span className="text-xs">Clubs</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center gap-1 -mt-8"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/50 hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'tournaments' ? 'text-purple-600' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Tournaments</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'profile' ? 'text-purple-600' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <UserIcon className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Gaming Session Modal */}
      {showCreateModal && (
        <CreateGamingSessionModal
          userId={userId}
          userName={userName}
          gamingClubs={gamingClubs}
          onClose={() => setShowCreateModal(false)}
          onSessionCreated={(session) => {
            setGamingSessions([...gamingSessions, session]);
            setShowCreateModal(false);
            toast.success('Gaming session created! 🎮');
          }}
        />
      )}

      {/* Club Detail Modal */}
      {selectedClub && (
        <ClubDetailModal
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
          onCreateSession={() => {
            setSelectedClub(null);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <WalletModal
          coins={userStats.coins}
          transactions={transactionHistory}
          onClose={() => setShowWalletModal(false)}
        />
      )}
      </div>
    </div>
  );
}

// Club Detail Modal Component
function ClubDetailModal({ club, onClose, onCreateSession }: { club: GamingClub; onClose: () => void; onCreateSession: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
      >
        {/* Header Image */}
        <div className="relative h-64">
          <ImageWithFallback src={club.image} alt={club.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-white mb-2">{club.name}</h2>
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-1">
                <MapPin className="w-5 h-5" />
                <span>{club.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span>{club.rating} ({club.reviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <Clock className="w-6 h-6 text-cyan-500 mb-2" />
              <p className="text-sm text-slate-500">Hours</p>
              <p className="text-slate-800">{club.openTime} - {club.closeTime}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <Zap className="w-6 h-6 text-yellow-500 mb-2" />
              <p className="text-sm text-slate-500">Rate</p>
              <p className="text-slate-800">₹{club.hourlyRate}/hr</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <Monitor className="w-6 h-6 text-purple-500 mb-2" />
              <p className="text-sm text-slate-500">Seats</p>
              <p className="text-slate-800">{club.totalSeats}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <DoorOpen className="w-6 h-6 text-pink-500 mb-2" />
              <p className="text-sm text-slate-500">Rooms</p>
              <p className="text-slate-800">{club.privateRooms}</p>
            </div>
          </div>

          {/* Consoles */}
          <div className="mb-6">
            <h3 className="text-slate-800 mb-3">Available Platforms</h3>
            <div className="flex flex-wrap gap-3">
              {club.consoles.map((console, i) => (
                <div key={i} className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 px-4 py-2 rounded-xl text-purple-700">
                  {console}
                </div>
              ))}
            </div>
          </div>

          {/* Games Library */}
          <div className="mb-6">
            <h3 className="text-slate-800 mb-3">Games Library ({club.gamesLibrary.length} games)</h3>
            <div className="flex flex-wrap gap-2">
              {club.gamesLibrary.map((game, i) => (
                <Badge key={i} className="bg-cyan-100 text-cyan-700 border-cyan-300">
                  {game}
                </Badge>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div className="mb-8">
            <h3 className="text-slate-800 mb-3">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {club.facilities.map((facility, i) => {
                const Icon = getFacilityIcon(facility);
                return (
                  <div key={i} className="flex items-center gap-2 text-slate-700">
                    <Icon className="w-5 h-5 text-purple-500" />
                    <span>{facility}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={onCreateSession}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 text-white text-lg py-6 shadow-lg"
          >
            Create Gaming Session Here
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Wallet Modal Component
function WalletModal({ coins, transactions, onClose }: { coins: number; transactions: any[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 p-8 text-white relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-12 h-12" />
            <div>
              <h2>My Wallet</h2>
              <p className="text-yellow-100 text-sm">Avento Coins</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl">{coins}</span>
            <span className="text-2xl text-yellow-100">coins</span>
          </div>
        </div>

        {/* Transaction History */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-800">Transaction History</h3>
            <Button className="bg-slate-800 hover:bg-slate-700 text-white text-sm">
              <History className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className="text-xl">{transaction.icon}</span>
                  </div>
                  <div>
                    <p className="text-slate-800">{transaction.description}</p>
                    <p className="text-xs text-slate-500">{transaction.date}</p>
                  </div>
                </div>
                <div className={`text-lg ${
                  transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'earn' ? '+' : ''}{transaction.amount}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
              <Gift className="w-5 h-5 mr-2" />
              Earn Coins
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              <CreditCard className="w-5 h-5 mr-2" />
              Redeem
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getFacilityIcon(facility: string) {
  if (facility.includes('Food') || facility.includes('Drinks')) return UtensilsCrossed;
  if (facility.includes('Streaming')) return Video;
  if (facility.includes('Private')) return DoorOpen;
  if (facility.includes('WiFi')) return Wifi;
  return Sparkles;
}
