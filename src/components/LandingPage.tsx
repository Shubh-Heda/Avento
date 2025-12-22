import { Users, Heart, Sparkles, Music, PartyPopper, Shield, TrendingUp, ArrowRight, Star, Zap, Clock, DollarSign, CheckCircle, UserPlus, ChevronDown, Play, X, Gamepad2 } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { ColorfulBackground } from './ColorfulBackground';

const AventoDemo = lazy(() => import('./AventoDemo'));

interface LandingPageProps {
  onGetStarted: () => void;
  onCategorySelect?: (category: 'sports' | 'events' | 'parties' | 'gaming') => void;
}

export function LandingPage({ onGetStarted, onCategorySelect }: LandingPageProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const [liveStats, setLiveStats] = useState({
    activeUsers: 127,
    newMatches: 8,
    friendshipsFormed: 3
  });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Live stats updater
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3),
        newMatches: Math.random() > 0.7 ? prev.newMatches + 1 : prev.newMatches,
        friendshipsFormed: Math.random() > 0.85 ? prev.friendshipsFormed + 1 : prev.friendshipsFormed,
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle video modal open/close
  useEffect(() => {
    if (isVideoModalOpen) {
      document.body.style.overflow = 'hidden';
      setIsDemoPlaying(true);
    } else {
      document.body.style.overflow = 'unset';
      setIsDemoPlaying(false);
    }
  }, [isVideoModalOpen]);

  // Calculate parallax offsets based on mouse position
  const getParallaxStyle = (intensity: number = 20) => {
    if (reduceMotion || typeof window === 'undefined') return {};
    const xOffset = (mousePosition.x - window.innerWidth / 2) / intensity;
    const yOffset = (mousePosition.y - window.innerHeight / 2) / intensity;
    return {
      transform: `translate(${xOffset}px, ${yOffset}px)`,
      transition: 'transform 0.3s ease-out'
    };
  };

  const faqs = [
    {
      question: "How does the 5-stage payment flow work?",
      answer: "First, you join for free. When the minimum number of players is reached, there's a soft lock. Then you get a dynamic payment window (30-90 minutes based on match timing). Unpaid players are removed at hard lock, and finally, you see exact share amounts with the confirmed team."
    },
    {
      question: "What are Trust Scores and how do I build them?",
      answer: "Trust Scores are earned through reliability (showing up on time), respect (positive interactions), and consistency (regular participation). Higher Trust Scores unlock premium features and give you priority in match selection."
    },
    {
      question: "What happens if I need to cancel after joining?",
      answer: "Before soft lock, you can cancel anytime for free. After payment, cancellations may affect your Trust Score unless you have a valid reason. We prioritize emotional safety and understanding."
    },
    {
      question: "How do Friendship Streaks work?",
      answer: "Play with the same people regularly, and you'll build Friendship Streaks! The longer your streak, the more perks you unlock together—like priority booking, special badges, and exclusive community events."
    },
    {
      question: "Can I create private matches with friends?",
      answer: "Absolutely! You can set visibility to 'Private' and invite specific friends. You can also choose 'Nearby' to connect with players in your area or 'Community' to open it up to everyone."
    },
    {
      question: "What makes Avento different from other booking platforms?",
      answer: "We're friendship-first, not just coordination. Every feature—from Trust Scores to post-match reflections—is designed to help you build genuine connections, not just fill slots."
    }
  ];

  return (
    <div className="min-h-screen avento-hero-bg overflow-hidden relative text-white">
      {/* Colorful Animated Background */}
      <ColorfulBackground />
      
      {/* Dark Overlay for Text Visibility */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      
      {/* Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Demo Video Container */}
              <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                {/* Avento Animated Demo */}
                <div className="w-full aspect-video">
                  <Suspense fallback={<div className="w-full h-full bg-black/60 flex items-center justify-center text-white/60">Loading demo…</div>}>
                    <AventoDemo isPlaying={isDemoPlaying} />
                  </Suspense>
                </div>

                {/* Close Button - Inside Video as Overlay */}
                <motion.button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all shadow-2xl z-50 px-6 py-3 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    <X className="w-6 h-6" />
                    <span>Exit Demo</span>
                  </div>
                </motion.button>
              </div>

              {/* Feature Pills Below Video */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {[
                  { icon: Shield, label: "Trust Scores", color: "from-green-500 to-emerald-500" },
                  { icon: TrendingUp, label: "Friendship Streaks", color: "from-orange-500 to-red-500" },
                  { icon: Users, label: "5-Stage Payment", color: "from-cyan-500 to-blue-500" },
                  { icon: Heart, label: "Community First", color: "from-pink-500 to-purple-500" }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`flex items-center gap-2 bg-gradient-to-r ${feature.color} px-4 py-2 rounded-full text-white text-sm`}
                  >
                    <feature.icon className="w-4 h-4" />
                    <span>{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Live Activity Counter - Floating Widget */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring" }}
        className="fixed top-24 right-4 z-40 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl hidden lg:block"
        style={getParallaxStyle(60)}
      >
        <div className="flex items-center gap-2 mb-3">
          <motion.div 
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs text-white/80">Live Activity</span>
        </div>
        <div className="space-y-2">
          <motion.div 
            key={liveStats.activeUsers}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-xs text-white/70">Active now</span>
            <span className="text-sm text-white">{liveStats.activeUsers}</span>
          </motion.div>
          <motion.div 
            key={liveStats.newMatches}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-xs text-white/70">Matches today</span>
            <span className="text-sm text-green-400">+{liveStats.newMatches}</span>
          </motion.div>
          <motion.div 
            key={liveStats.friendshipsFormed}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-xs text-white/70">New friends</span>
            <span className="text-sm text-pink-400">+{liveStats.friendshipsFormed}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-amber-400 rounded-xl flex items-center justify-center relative"
              animate={{
                rotate: [0, 5, -5, 0],
                boxShadow: [
                  "0 0 20px rgba(14, 165, 233, 0.4)",
                  "0 0 30px rgba(245, 158, 11, 0.5)",
                  "0 0 20px rgba(14, 165, 233, 0.4)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                className="text-4xl font-black tracking-tight"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  background: "linear-gradient(90deg, #0ea5e9, #22d3ee, #f59e0b)",
                  backgroundSize: "180% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Avento
              </motion.h1>
              <motion.p 
                className="text-xs bg-gradient-to-r from-cyan-200 to-amber-200 bg-clip-text text-transparent"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Where Every Moment Becomes a Memory
              </motion.p>
            </div>
          </motion.div>

          <button
            onClick={() => setReduceMotion(!reduceMotion)}
            className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:border-white/30 transition"
            aria-pressed={reduceMotion}
          >
            <Zap className="w-4 h-4" />
            {reduceMotion ? 'Motion Off' : 'Motion On'}
          </button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <motion.div 
          className="text-center max-w-5xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center gap-4 bg-black/85 backdrop-blur-md text-white px-8 py-5 rounded-full mb-5 border-2 border-white/60 shadow-2xl hover:shadow-3xl transition-shadow"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex-shrink-0"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black tracking-tight text-green-300">⚽ Sports</span>
              <span className="text-white/70">•</span>
              <span className="text-lg font-black tracking-tight text-purple-300">🎵 Culture</span>
              <span className="text-white/70">•</span>
              <span className="text-lg font-black tracking-tight text-pink-400">🎉 Parties</span>
              <span className="text-white/70">•</span>
              <span className="text-lg font-black tracking-tight text-blue-300">🎮 Gaming</span>
            </div>
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex-shrink-0"
            >
              <Heart className="w-6 h-6 text-pink-300" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="mb-4 relative text-5xl md:text-7xl font-black leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={getParallaxStyle(30)}
          >
            <span className="relative z-10 block text-white drop-shadow-2xl">
              Belong through
            </span>
            <span className="relative z-10 block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl font-black">
              sports, culture, and celebrations
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-white text-xl md:text-2xl mb-6 max-w-3xl mx-auto relative bg-black/50 rounded-2xl px-8 py-5 border-2 border-white/50 font-medium leading-relaxed shadow-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={getParallaxStyle(35)}
          >
            <span className="relative z-10">
              Book games, join festivals, and meet people you can trust. Avento connects you to experiences that feel safe, welcoming, and memorable.
            </span>
          </motion.p>

          {/* Remove the buttons section completely */}

          <motion.div
            className="flex flex-wrap justify-center gap-4 text-lg md:text-xl text-white mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={getParallaxStyle(28)}
          >
            <motion.div
              className="px-8 py-5 rounded-full bg-white/95 backdrop-blur-md border-2 border-cyan-400/90 text-slate-900 font-black shadow-2xl hover:shadow-3xl transition-shadow"
              whileHover={{ scale: 1.08, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤝</span>
                <span className="text-lg md:text-xl"><span className="text-slate-900 font-black">Play</span> with people you trust</span>
              </div>
            </motion.div>
            <motion.div
              className="px-8 py-5 rounded-full bg-white/95 backdrop-blur-md border-2 border-purple-400/90 text-slate-900 font-black shadow-2xl hover:shadow-3xl transition-shadow"
              whileHover={{ scale: 1.08, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                <span className="text-lg md:text-xl"><span className="text-slate-900 font-black">Celebrate</span> culture together</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Preview Animation/Video Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
            style={getParallaxStyle(25)}
          >
            <div className="relative max-w-3xl mx-auto">
              <div className="relative group cursor-pointer" onClick={() => setIsVideoModalOpen(true)}>
                {/* Video Thumbnail */}
                <div className="relative rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fm=webp"
                    alt="Friends celebrating after a match"
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Play Button */}
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div 
                      className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl"
                      animate={{ 
                        boxShadow: [
                          "0 0 0 0 rgba(6, 182, 212, 0.4)",
                          "0 0 0 20px rgba(6, 182, 212, 0)",
                          "0 0 0 0 rgba(6, 182, 212, 0)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="w-10 h-10 text-cyan-600 ml-1" fill="currentColor" />
                    </motion.div>
                  </motion.div>

                  {/* Hover Overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-all duration-300"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  />

                  {/* Animated Stats Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                    <motion.div 
                      className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    >
                      <div className="text-white text-xs">Trust Score</div>
                      <div className="text-green-400">92/100</div>
                    </motion.div>
                    <motion.div 
                      className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    >
                      <div className="text-white text-xs">Streak</div>
                      <div className="text-orange-400">🔥 12 days</div>
                    </motion.div>
                    <motion.div 
                      className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    >
                      <div className="text-white text-xs">Connections</div>
                      <div className="text-purple-400">47 friends</div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow-lg pointer-events-none"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" fill="currentColor" />
                    <span className="text-sm">Watch Demo</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Category Selector Cards */}
        <motion.div 
          className="mt-12 relative"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {/* Welcome Text */}
          <div className="text-center mb-6">
            <motion.h2 
              className="text-slate-900 mb-3 text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-blue-700">Welcome,</span> <span className="text-amber-700">Friend!</span> 👋
            </motion.h2>
            <motion.p 
              className="text-slate-800 text-xl md:text-2xl font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Choose your experience and start connecting with your community
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Sports Card */}
            <motion.div
              onClick={() => onCategorySelect?.('sports')}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="group overflow-hidden rounded-3xl shadow-2xl border-2 border-cyan-400/40 cursor-pointer hover:border-cyan-400/70 transition-all bg-white flex flex-col h-full"
            >
              {/* Background Image */}
              <div className="relative h-[200px] flex-shrink-0 overflow-hidden">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1630420598771-dd52ab08c8cb?crop=entropy&cs=tinysrgb&fit=max&w=800&auto=format&fm=webp"
                  alt="Sports and Turf"
                  className="w-full h-[200px] object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Icon */}
                <div className="absolute top-6 left-6">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Users className="w-7 h-7 text-cyan-600" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 flex flex-col flex-1">
                <h3 className="mb-3 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Sports & Turf</h3>
                <p className="text-slate-700 mb-4 text-sm leading-relaxed font-medium flex-1">
                  Book turfs, find players, and build your sports community with Trust Scores and Friendship Streaks
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-600 hover:via-cyan-500 hover:to-blue-600 text-white gap-2 group/btn shadow-xl font-semibold text-lg py-6"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>

            {/* Cultural Events Card */}
            <motion.div
              onClick={() => onCategorySelect?.('events')}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="group overflow-hidden rounded-3xl shadow-2xl border-2 border-purple-400/40 cursor-pointer hover:border-purple-400/70 transition-all bg-white flex flex-col h-full"
            >
              {/* Background Image */}
              <div className="relative h-[200px] flex-shrink-0 overflow-hidden">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1735748917428-be035e873f97?crop=entropy&cs=tinysrgb&fit=max&w=800&auto=format&fm=webp"
                  alt="Cultural Events"
                  className="w-full h-[200px] object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Icon */}
                <div className="absolute top-6 left-6">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Music className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 flex flex-col flex-1">
                <h3 className="mb-3 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Cultural Events</h3>
                <p className="text-slate-700 mb-4 text-sm leading-relaxed font-medium flex-1">
                  Discover festivals, concerts, art exhibitions, and cultural gatherings that celebrate diversity.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 via-purple-400 to-pink-500 hover:from-purple-600 hover:via-purple-500 hover:to-pink-600 text-white gap-2 group/btn shadow-xl font-semibold text-lg py-6"
                >
                  Explore Events
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>

            {/* Parties Card */}
            <motion.div
              onClick={() => onCategorySelect?.('parties')}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="group overflow-hidden rounded-3xl shadow-2xl border-2 border-pink-400/40 cursor-pointer hover:border-pink-400/70 transition-all bg-white flex flex-col h-full"
            >
              {/* Background Image */}
              <div className="relative h-[200px] flex-shrink-0 overflow-hidden">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1739734963154-7a8b3c8e5944?crop=entropy&cs=tinysrgb&fit=max&w=800&auto=format&fm=webp"
                  alt="Parties and Celebrations"
                  className="w-full h-[200px] object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Icon */}
                <div className="absolute top-6 left-6">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <PartyPopper className="w-7 h-7 text-pink-600" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 flex flex-col flex-1">
                <h3 className="mb-3 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Parties & Celebrations</h3>
                <p className="text-slate-700 mb-4 text-sm leading-relaxed font-medium flex-1">
                  Create unforgettable nights, meet new people, and celebrate life's special moments together.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 via-rose-400 to-red-500 hover:from-pink-600 hover:via-rose-500 hover:to-red-600 text-white gap-2 group/btn shadow-xl font-semibold text-lg py-6"
                >
                  Join Parties
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>

            {/* Gaming Hub Card - NEW! */}
            <motion.div
              onClick={() => onCategorySelect?.('gaming')}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="group overflow-hidden rounded-3xl shadow-2xl border-2 border-indigo-400/40 cursor-pointer hover:border-indigo-400/70 transition-all bg-white flex flex-col h-full"
            >
              {/* Background Image */}
              <div className="relative h-[200px] flex-shrink-0 overflow-hidden">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1511512578047-dfb367046420?crop=entropy&cs=tinysrgb&fit=max&w=800&auto=format&fm=webp"
                  alt="Gaming Hub"
                  className="w-full h-[200px] object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Icon */}
                <div className="absolute top-6 left-6">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Gamepad2 className="w-7 h-7 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 flex flex-col flex-1">
                <h3 className="mb-3 text-2xl md:text-3xl font-black tracking-tight leading-tight bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">Gaming Hub</h3>
                <p className="text-slate-700 mb-4 text-sm leading-relaxed font-medium flex-1">
                  Join gaming clubs, play PS5/Xbox/PC, compete in tournaments, and level up your friendships.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-500 via-blue-400 to-violet-500 hover:from-indigo-600 hover:via-blue-500 hover:to-violet-600 text-white gap-2 group/btn shadow-xl font-semibold text-lg py-6"
                >
                  Start Gaming
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Trust Badge Showcase */}
      <section className="relative py-20 bg-gradient-to-b from-transparent via-black/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 bg-black/60 rounded-3xl p-8 mx-auto max-w-4xl border-2 border-white/40 shadow-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={getParallaxStyle(50)}
          >
            <h2 className="mb-4 text-white text-3xl md:text-5xl font-black tracking-tight">Build Your <span className="text-cyan-300">Reputation</span></h2>
            <p className="text-white/90 text-xl md:text-2xl font-semibold max-w-2xl mx-auto">
              Earn badges, build trust, and unlock exclusive perks as you connect with your community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Trust Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-md p-8 rounded-3xl border border-green-500/20"
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-green-400">92</span>
                  </div>
                </motion.div>
                <motion.div 
                  className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-5 h-5 text-white" fill="currentColor" />
                </motion.div>
              </div>
              <h3 className="text-white text-center mb-2">Trust Score</h3>
              <p className="text-slate-300 text-center text-sm mb-4">
                Built through reliability, respect, and positive vibes.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reliability</span>
                  <span className="text-green-400">95%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "95%" }}
                    viewport={{ once: true }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Friendship Streak Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-md p-8 rounded-3xl border border-orange-500/20"
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-4xl">🔥</span>
                </motion.div>
              </div>
              <h3 className="text-white text-center mb-2">12 Day Streak</h3>
              <p className="text-slate-300 text-center text-sm mb-4">
                Consistency builds deeper connections.
              </p>
              <div className="flex justify-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-6 h-6 rounded-full ${i < 5 ? 'bg-orange-500' : 'bg-slate-700'} flex items-center justify-center`}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {i < 5 && <span className="text-xs">✓</span>}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Behavioral Badges Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md p-8 rounded-3xl border border-purple-500/20"
            >
              <div className="relative mb-6">
                <div className="flex justify-center gap-2">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Shield className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
              </div>
              <h3 className="text-white text-center mb-2">Your Badges</h3>
              <p className="text-slate-300 text-center text-sm mb-4">
                Earned through exceptional behavior.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: "🌟", label: "Newbie Friendly" },
                  { icon: "🛡️", label: "High Trust" },
                  { icon: "⚡", label: "Quick Responder" },
                ].map((badge, i) => (
                  <motion.div
                    key={i}
                    className="bg-white/5 rounded-xl p-2 text-center"
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-[10px] text-slate-300">{badge.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - 5 Stage Payment Flow */}
      <section className="relative py-20 bg-gradient-to-b from-black/40 via-black/60 to-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 bg-white/60 rounded-3xl p-8 mx-auto max-w-4xl border-2 border-white/80 shadow-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={getParallaxStyle(50)}
          >
            <h2 className="mb-4 text-slate-900 text-3xl md:text-5xl font-black tracking-tight">How <span className="text-orange-600">Payment</span> Works</h2>
            <p className="text-slate-800 text-xl md:text-2xl font-semibold max-w-2xl mx-auto">
              Our unique 5-stage flow ensures fairness, transparency, and commitment.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-cyan-400 to-amber-400 transform -translate-x-1/2 rounded-full" />

            {/* Stages */}
            <div className="space-y-12">
              {[
                {
                  stage: "1",
                  title: "Free Joining",
                  description: "Join any match completely free. Browse, explore, and commit only when you're ready.",
                  icon: UserPlus,
                  color: "from-cyan-500 to-amber-400",
                  badge: "No commitment"
                },
                {
                  stage: "2",
                  title: "Soft Lock",
                  description: "When the minimum number of players join, the match is soft-locked. You're in, but the payment window hasn't started yet.",
                  icon: Users,
                  color: "from-cyan-500 to-amber-400",
                  badge: "Min players reached"
                },
                {
                  stage: "3",
                  title: "Dynamic Payment Window",
                  description: "Get 30-90 minutes to pay based on match timing. Plenty of time to complete your payment hassle-free.",
                  icon: Clock,
                  color: "from-cyan-500 to-amber-400",
                  badge: "30-90 minutes"
                },
                {
                  stage: "4",
                  title: "Hard Lock",
                  description: "Payment window closes. Unpaid players are automatically removed to ensure committed teams.",
                  icon: Shield,
                  color: "from-cyan-500 to-amber-400",
                  badge: "Commitment confirmed"
                },
                {
                  stage: "5",
                  title: "Final Confirmation",
                  description: "See your exact share amount with the final confirmed team. No surprises, complete transparency.",
                  icon: CheckCircle,
                  color: "from-cyan-500 to-amber-400",
                  badge: "All set!"
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex items-center ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col gap-8`}
                >
                  {/* Content Card */}
                  <div className="flex-1 lg:w-1/2">
                    <motion.div 
                      className="bg-black/90 backdrop-blur-md p-8 rounded-3xl border-2 border-white/50 hover:border-white/70 transition-all shadow-xl"
                      whileHover={{ scale: 1.02, y: -5 }}
                      style={getParallaxStyle(80)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                          <item.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-white text-xl font-bold">{item.title}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-white/85 font-medium">{item.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Stage Number Circle */}
                  <div className="flex-shrink-0 lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 z-10">
                    <motion.div 
                      className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-900`}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="text-white text-xl">{item.stage}</span>
                    </motion.div>
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className="flex-1 lg:w-1/2 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Instagram Style Feed */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 bg-white/60 rounded-3xl p-8 mx-auto max-w-4xl border-2 border-white/80 shadow-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={getParallaxStyle(50)}
          >
            <h2 className="mb-4 text-slate-900 text-3xl md:text-5xl font-black tracking-tight">Real Stories, Real <span className="text-cyan-600">Connections</span></h2>
            <p className="text-slate-800 text-xl md:text-2xl font-semibold max-w-2xl mx-auto">
              See what our community is experiencing every day.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                user: "Priya Sharma",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
                image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600",
                caption: "Found my weekend football crew! 3 months in and we're more like family now ⚽❤️ #AventoFam",
                likes: 124,
                time: "2h ago"
              },
              {
                user: "Rahul Patel",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600",
                caption: "Trust score 95! When you show up consistently, magic happens 🌟 12 game streak and counting!",
                likes: 89,
                time: "5h ago"
              },
              {
                user: "Ananya Desai",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
                image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600",
                caption: "From strangers to celebration partners 🎉 Avento makes every party feel like home!",
                likes: 156,
                time: "1d ago"
              },
            ].map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white backdrop-blur-md rounded-3xl overflow-hidden border-2 border-slate-300 shadow-xl"
                style={getParallaxStyle(70 + i * 10)}
              >
                {/* Post Header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-300">
                    <ImageWithFallback src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-900 text-sm font-semibold">{post.user}</div>
                    <div className="text-slate-500 text-xs">{post.time}</div>
                  </div>
                </div>

                {/* Post Image */}
                <div className="relative h-64 overflow-hidden">
                  <ImageWithFallback src={post.image} alt="Post" className="w-full h-full object-cover" />
                </div>

                {/* Post Actions */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <motion.button 
                      className="flex items-center gap-2 text-pink-500"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart className="w-5 h-5" fill="currentColor" />
                      <span className="text-sm font-semibold">{post.likes}</span>
                    </motion.button>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    <span className="text-slate-900 font-bold mr-2">{post.user.split(' ')[0]}</span>
                    {post.caption}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-gradient-to-b from-transparent via-black/40 to-black/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 bg-white/60 rounded-3xl p-8 mx-auto max-w-4xl border-2 border-white/80 shadow-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-slate-900 text-3xl md:text-5xl font-black tracking-tight">Built for <span className="text-teal-600">Connection</span>, Not Just Coordination</h2>
            <p className="text-slate-800 text-xl md:text-2xl font-semibold max-w-2xl mx-auto">
              Every feature is designed with emotional safety and community at its core.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Trust Scores", desc: "Build reputation through reliability, respect, and positive interactions.", color: "from-red-500 to-orange-500" },
              { icon: TrendingUp, title: "Friendship Streaks", desc: "Celebrate consistency and deepen bonds through shared experiences.", color: "from-yellow-500 to-green-500" },
              { icon: Heart, title: "Experience Reflections", desc: "Share gratitude and celebrate moments after every event.", color: "from-green-500 to-cyan-500" },
              { icon: Star, title: "Community Rituals", desc: "Traditions that make you belong and feel at home.", color: "from-blue-500 to-purple-500" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                }}
                className="bg-black/85 backdrop-blur-md p-8 rounded-2xl border-2 border-white/40 hover:border-white/60 transition-all shadow-xl"
              >
                <motion.div 
                  className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-200">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 text-center border-2 border-white/80 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="max-w-3xl mx-auto mb-12">
              <Sparkles className="w-14 h-14 text-amber-600 mx-auto mb-4" />
              <h2 className="mb-4 text-slate-900 text-3xl md:text-5xl font-black tracking-tight">More Than a Platform</h2>
              <p className="text-slate-800 text-xl md:text-2xl font-semibold">
                It's a movement to help people find their people—a space where showing up consistently, 
                being kind, and building genuine connections is celebrated.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { value: "25K+", label: "Meaningful Connections" },
                { value: "1,500+", label: "Events & Experiences" },
                { value: "97%", label: "Feel More Connected" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                  className="relative"
                >
                  <motion.div 
                    className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent inline-block text-4xl md:text-5xl font-black"
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-white text-lg md:text-xl font-semibold mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 bg-gradient-to-b from-black/40 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 bg-white/60 rounded-3xl p-8 mx-auto max-w-4xl border-2 border-white/80 shadow-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={getParallaxStyle(50)}
          >
            <h2 className="mb-4 text-slate-900 text-3xl md:text-5xl font-black tracking-tight">Frequently Asked <span className="text-indigo-600">Questions</span></h2>
            <p className="text-slate-800 text-xl md:text-2xl font-semibold">
              Everything you need to know about Avento.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-black/85 backdrop-blur-md rounded-2xl border-2 border-white/30 overflow-hidden shadow-lg"
                style={getParallaxStyle(60 + i * 5)}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/10 transition-colors"
                >
                  <span className="text-white pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openFaqIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaqIndex === i ? "auto" : 0,
                    opacity: openFaqIndex === i ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 text-white/85 font-medium">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-black/60"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ backgroundSize: "200% 200%" }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 bg-black/60 rounded-3xl p-12 border-2 border-white/40 shadow-2xl">
          <motion.h2 
            className="mb-6 text-white text-4xl md:text-6xl font-black tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to Find Your People?
          </motion.h2>
          <motion.p 
            className="text-white/90 text-xl md:text-2xl font-semibold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join thousands experiencing sports, culture, and celebrations together.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/60 backdrop-blur-xl border-t border-white/10 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-amber-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-cyan-300 to-amber-200 bg-clip-text text-transparent">Avento</span>
          </div>
          <p className="text-center text-slate-300">
            Where Every Moment Becomes a Memory.
          </p>
          <p className="text-center text-slate-400 mt-2">
            Sports • Cultural Events • Parties
          </p>
        </div>
      </footer>
    </div>
  );
}