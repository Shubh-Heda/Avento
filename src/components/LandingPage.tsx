import { Users, Heart, Sparkles, Music, Shield, TrendingUp, ArrowRight, Star, Zap, Clock, DollarSign, CheckCircle, UserPlus, ChevronDown, Play, X, Gamepad2 } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import sportsImg from '../assets/categories/sports.jpg';
import eventsImg from '../assets/categories/events.jpg';
import gamingImg from '../assets/categories/gaming.jpg';
import { AventoLogo } from './AventoLogo';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import type { LazyExoticComponent, ComponentType } from 'react';
import { ColorfulBackground } from './ColorfulBackground';
import Traction from './Traction';
import { supabase } from '../lib/supabase';

const AventoDemo: LazyExoticComponent<ComponentType<{ isPlaying: boolean }>> = lazy(() => import('./AventoDemo').then(m => ({ default: (m as any).default || (m as any).AventoDemo })) as any);

interface LandingPageProps {
  onGetStarted: () => void;
  onCategorySelect?: (category: 'sports' | 'events' | 'gaming') => void;
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
  const [reduceMotion, setReduceMotion] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackFeature, setFeedbackFeature] = useState<'Sports' | 'Events' | 'Gaming' | ''>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
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

  const paymentStages = [
    {
      stage: "01",
      title: "Join Free",
      icon: UserPlus,
      pill: "No card needed",
      points: ["Browse lobbies", "Pick your slot", "Stay flexible"],
    },
    {
      stage: "02",
      title: "Soft Lock",
      icon: Users,
      pill: "Min players hit",
      points: ["Squad is secured", "Everyone notified", "Trust nudges start"],
    },
    {
      stage: "03",
      title: "Pay Window",
      icon: Clock,
      pill: "30-90 mins",
      points: ["Timer auto-sets", "Split is visible", "Smart reminders (push/SMS)", "Stripe + UPI ready"],
    },
    {
      stage: "04",
      title: "Hard Lock",
      icon: Shield,
      pill: "Only paid stay",
      points: ["Unpaid drop off", "Teams stabilize", "Host can fill gaps"],
    },
    {
      stage: "05",
      title: "Final Receipt",
      icon: CheckCircle,
      pill: "Zero surprises",
      points: ["Exact share shown", "Instant confirmations", "Trust Score protected"],
    },
  ];

  const businessPillars = [
    {
      title: "Freemium Core",
      icon: Sparkles,
      accent: "from-amber-400 to-pink-500",
      points: ["Browse & join for free", "Trust layer included", "Friends-first UX"],
    },
    {
      title: "Premium Boosts",
      icon: TrendingUp,
      accent: "from-cyan-400 to-emerald-500",
      points: ["Priority slots", "Advanced filters", "Spotlighted profile"],
    },
    {
      title: "Partners & Venues",
      icon: Heart,
      accent: "from-violet-400 to-blue-500",
      points: ["Discounted lanes", "Sponsored drops", "Co-hosted events"],
    },
  ];

  const refundMoments = [
    {
      title: "Before Soft Lock",
      icon: ArrowRight,
      color: "from-emerald-500 to-teal-400",
      copy: "Full cancel + refund, no penalties.",
    },
    {
      title: "During Pay Window",
      icon: Clock,
      color: "from-amber-500 to-orange-400",
      copy: "Partial refunds follow the timer rules to keep squads fair.",
    },
    {
      title: "After Hard Lock",
      icon: Shield,
      color: "from-rose-500 to-red-500",
      copy: "Limited refunds; trust impact only if no verified reason is provided.",
    },
  ];

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0 || feedbackText.trim() === '') {
      setFeedbackError('Please provide a rating and feedback text.');
      return;
    }
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const feedbackPayload = {
        rating: feedbackRating,
        feedback_text: feedbackText.trim(),
        feature: feedbackFeature || null,
        source: 'landing'
      };

      const { error } = await supabase.from('website_feedback').insert(feedbackPayload);
      if (error) throw error;

      const webhookUrl = import.meta.env.VITE_FEEDBACK_WEBHOOK_URL as string | undefined;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...feedbackPayload,
            page_url: typeof window !== 'undefined' ? window.location.href : null,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            submitted_at: new Date().toISOString()
          })
        });
      }
      setFeedbackSubmitted(true);
      toast.success('Feedback recorded! Thank you for your input.', {
        description: 'We appreciate your thoughts and will use them to improve Avento.',
        duration: 4000,
      });
      setTimeout(() => {
        setFeedbackRating(0);
        setFeedbackText('');
        setFeedbackFeature('');
        setFeedbackSubmitted(false);
      }, 2000);
    } catch (error: any) {
      setFeedbackError(error?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

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
          <span className="text-sm font-semibold text-white">Live Activity</span>
        </div>
        <div className="space-y-2">
          <motion.div 
            key={liveStats.activeUsers}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-sm font-medium text-white">Active now</span>
            <span className="text-base font-bold text-white">{liveStats.activeUsers}</span>
          </motion.div>
          <motion.div 
            key={liveStats.newMatches}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-sm font-medium text-white">Matches today</span>
            <span className="text-base font-bold text-green-400">+{liveStats.newMatches}</span>
          </motion.div>
          <motion.div 
            key={liveStats.friendshipsFormed}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-sm font-medium text-white">New friends</span>
            <span className="text-base font-bold text-pink-400">+{liveStats.friendshipsFormed}</span>
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
              <span className="text-lg font-black tracking-tight text-purple-300">🎵 Events</span>
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
              sports, culture, and games
            </span>
          </motion.h1>
          
          <div className="max-w-4xl mx-auto mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg">
                <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-cyan-100" />
                <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-amber-100" />
                <div className="relative flex items-start gap-3">
                  <span className="text-3xl">⚽</span>
                  <div className="text-left">
                    <div className="text-lg font-bold text-slate-900">Book Games</div>
                    <div className="text-sm text-slate-600 leading-relaxed">Find nearby games, lock your slot, and show up with confidence.</div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg">
                <div className="absolute -top-2 -left-2 h-10 w-10 rounded-full bg-purple-100" />
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-pink-100" />
                <div className="relative flex items-start gap-3">
                  <span className="text-3xl">🎭</span>
                  <div className="text-left">
                    <div className="text-lg font-bold text-slate-900">Join Festivals</div>
                    <div className="text-sm text-slate-600 leading-relaxed">Discover cultural events and plan nights out with your community.</div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg">
                <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-emerald-100" />
                <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-sky-100" />
                <div className="relative flex items-start gap-3">
                  <span className="text-3xl">🤝</span>
                  <div className="text-left">
                    <div className="text-lg font-bold text-slate-900">Meet People You Can Trust</div>
                    <div className="text-sm text-slate-600 leading-relaxed">Connect with verified profiles and build real friendships.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <motion.div
            className="flex flex-wrap justify-center gap-4 text-lg md:text-xl text-white mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={getParallaxStyle(28)}
          >
            <motion.div
              className="px-8 py-6 rounded-full bg-white/95 backdrop-blur-md border-2 border-cyan-400/90 text-slate-900 font-semibold shadow-2xl hover:shadow-3xl transition-shadow"
              whileHover={{ scale: 1.08, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤝</span>
                <span className="text-xl md:text-2xl leading-relaxed"><span className="text-slate-900 font-semibold">Play</span> with people you trust</span>
              </div>
            </motion.div>
            <motion.div
              className="px-8 py-6 rounded-full bg-white/95 backdrop-blur-md border-2 border-purple-400/90 text-slate-900 font-semibold shadow-2xl hover:shadow-3xl transition-shadow"
              whileHover={{ scale: 1.08, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                <span className="text-xl md:text-2xl leading-relaxed"><span className="text-slate-900 font-semibold">Celebrate</span> culture together</span>
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
                      className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    >
                      <div className="text-white text-sm font-semibold">Trust Score</div>
                      <div className="text-green-400 text-base font-bold">92/100</div>
                    </motion.div>
                    <motion.div 
                      className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    >
                      <div className="text-white text-sm font-semibold">Streak</div>
                      <div className="text-orange-400 text-base font-bold">🔥 12 days</div>
                    </motion.div>
                    <motion.div 
                      className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    >
                      <div className="text-white text-sm font-semibold">Connections</div>
                      <div className="text-purple-400 text-base font-bold">47 friends</div>
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
          <div className="flex flex-col gap-6 w-full mx-auto items-stretch">

            {/* Sports Row: image left, content right */}
            <motion.div
              onClick={() => onCategorySelect?.("sports")}
              whileHover={{ scale: 1.01, y: -6 }}
              whileTap={{ scale: 0.99 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="group overflow-hidden rounded-3xl shadow-2xl border-2 border-cyan-400/40 cursor-pointer hover:border-cyan-400/70 transition-all bg-white flex flex-col md:flex-row"
            >
              <div className="relative md:w-1/2 h-[240px] md:h-[280px] flex-shrink-0 overflow-hidden">
                <ImageWithFallback
                  src={sportsImg}
                  alt="Sports and Turf"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110 saturate-90 contrast-105"
                />
                <div className="absolute inset-0 bg-black/25 mix-blend-multiply z-10"></div>
                <div className="absolute top-6 left-6 z-20">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Users className="w-7 h-7 text-cyan-600" />
                  </div>
                </div>
              </div>

              <div className="md:w-1/2 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 md:p-8 flex flex-col justify-center gap-4">
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Sports & Turf
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                  Book turfs, find players, and build your sports community with Trust Scores and Friendship Streaks.
                </p>
                <div className="flex md:justify-start">
                  <Button className="w-full md:w-auto px-6 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-600 hover:via-cyan-500 hover:to-blue-600 text-white gap-2 group/btn shadow-xl font-semibold text-lg py-6 h-14">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
            {/* Events Row: image left, content right */}
            <motion.div
              onClick={() => onCategorySelect?.("events")}
              whileHover={{ scale: 1.01, y: -6 }}
              whileTap={{ scale: 0.99 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="group overflow-hidden rounded-3xl shadow-2xl border-2 border-purple-400/40 cursor-pointer hover:border-purple-400/70 transition-all bg-white flex flex-col md:flex-row"
            >
              <div className="relative md:w-1/2 h-[240px] md:h-[320px] flex-shrink-0 overflow-hidden">
                <ImageWithFallback
                  src={eventsImg}
                  alt="Events"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110 saturate-90 contrast-105"
                />
                <div className="absolute inset-0 bg-black/25 mix-blend-multiply z-10"></div>
                <div className="absolute top-6 left-6 z-20">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Music className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="md:w-1/2 bg-gradient-to-br from-purple-50 to-pink-50 p-6 md:p-8 flex flex-col justify-center gap-4 md:min-h-[320px]">
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Events
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                  Discover concerts, festivals, exhibitions, and standout experiences with your community.
                </p>
                <div className="flex md:justify-start">
                  <Button className="w-full md:w-auto px-6 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-500 hover:from-purple-600 hover:via-purple-500 hover:to-pink-600 text-white gap-2 group/btn shadow-xl font-semibold text-lg py-6 h-14">
                    Explore Events
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              onClick={() => onCategorySelect?.("gaming")}
              whileHover={{ scale: 1.01, y: -6 }}
              whileTap={{ scale: 0.99 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="group overflow-hidden rounded-3xl shadow-2xl border-2 border-cyan-400/40 cursor-pointer hover:border-cyan-400/70 transition-all bg-white flex flex-col md:flex-row"
            >
              <div className="relative md:w-1/2 h-[240px] md:h-[280px] flex-shrink-0 overflow-hidden">
                <ImageWithFallback
                  src={gamingImg}
                  alt="Gaming"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110 saturate-90 contrast-105"
                />
                <div className="absolute inset-0 bg-black/25 mix-blend-multiply z-10"></div>
                <div className="absolute top-6 left-6 z-20">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Gamepad2 className="w-7 h-7 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="md:w-1/2 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 md:p-8 flex flex-col justify-center gap-4">
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Gaming
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                  Join gaming clubs, play PS5/Xbox/PC, compete in tournaments, and level up your friendships.
                </p>
                <div className="flex md:justify-start">
                  <Button className="w-full md:w-auto px-6 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-600 hover:via-cyan-500 hover:to-blue-600 text-white gap-2 group/btn shadow-xl font-semibold text-lg py-6 h-14">
                    Game Now
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Gaming Row: image left, content right */}
            
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mt-12">
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
              <h3 className="text-white text-center text-xl font-bold mb-2">12 Day Streak</h3>
              <p className="text-white text-center text-base font-medium mb-4">
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
              <h3 className="text-white text-center text-xl font-bold mb-2">Your Badges</h3>
              <p className="text-white text-center text-base font-medium mb-4">
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
                    className="bg-white/10 rounded-xl p-3 text-center border border-white/20"
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-semibold text-white">{badge.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

      </section>

      {/* How It Works - 5 Stage Payment Flow */}
      <section className="relative py-24 bg-gradient-to-b from-black/40 via-black/60 to-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 bg-white/60 rounded-3xl p-8 mx-auto max-w-4xl border-2 border-white/80 shadow-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={getParallaxStyle(50)}
          >
            <h2 className="mb-4 text-slate-900 text-3xl md:text-5xl font-black tracking-tight">How <span className="text-orange-600">Payment</span> Works</h2>
            <p className="text-slate-800 text-xl md:text-2xl font-semibold max-w-3xl mx-auto">
              A 5-step visual flow: short cards, clear timers, and zero surprise charges.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4">
            {paymentStages.map((item, i) => (
              <motion.div
                key={item.stage}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative h-full rounded-2xl border border-white/10 bg-black/85 p-5 shadow-2xl hover:-translate-y-1 hover:border-white/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-amber-400 flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-white/80">Step {item.stage}</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <span className="inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white mb-3">
                  {item.pill}
                </span>
                <ul className="space-y-2 text-base text-white font-medium">
                  {item.points.map((point, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { label: "No-shows drop", value: "-37%", desc: "after soft lock alerts" },
              { label: "Timer clarity", value: "< 5s", desc: "to see your pay window" },
              { label: "Payout speed", value: "T+1", desc: "fast settlement with Stripe" },
            ].map((fact, idx) => (
              <div key={idx} className="rounded-xl border border-white/20 bg-black/60 px-5 py-4 flex items-center justify-between">
                <div className="text-white font-semibold text-base">{fact.label}</div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{fact.value}</div>
                  <div className="text-white text-sm font-medium">{fact.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Score Pulse */}
      <section className="relative py-20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-green-400/25 blur-3xl" />
          <div className="absolute right-6 bottom-6 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-[1.1fr,0.9fr] gap-8 items-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-start gap-4">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-amber-300 opacity-70 blur" aria-hidden />
                <div className="relative h-28 w-28 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 p-3 flex items-center justify-center">
                    <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-white text-3xl font-black">92</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-sm font-semibold text-white">Live Trust Score</div>
                <h3 className="text-white text-2xl font-bold leading-tight">High trust keeps matches clean and drop-offs low.</h3>
                <p className="text-white text-base font-medium leading-relaxed">Transparent payment stages, attendance streaks, and dispute resolution all feed into your score. Push + SMS reminders keep the window moving.</p>
                <div className="flex flex-wrap gap-3 text-base text-white">
                  <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/30 font-semibold">No-shows down 37%</div>
                  <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/30 font-semibold">UPI + Stripe ready</div>
                  <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/30 font-semibold">Fair-play nudges</div>
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              {["Soft lock alerts go out instantly to keep momentum.", "Dynamic pay window reminders prevent last-minute churn.", "Trust-impact visibility before you cancel reduces disputes."].map((line, idx) => (
                <div key={idx} className="rounded-2xl border border-white/20 bg-black/60 px-4 py-3 flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-white text-base font-medium">{line}</span>
                </div>
              ))}
              <Button className="justify-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300 text-slate-900 font-semibold shadow-lg hover:scale-[1.01] transition">
                View trust profile
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials — replaced with feedback form */}
      <section className="relative py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-gradient-to-br from-blue-400/30 via-cyan-400/25 to-teal-400/20 blur-3xl" />
          <div className="absolute right-6 bottom-6 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-300/20 via-purple-300/20 to-pink-300/20 blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-8 bg-white/85 backdrop-blur-lg rounded-3xl p-8 mx-auto border border-white/80 shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={getParallaxStyle(30)}
          >
            <h2 className="mb-2 text-slate-900 text-3xl md:text-4xl font-black tracking-tight">Share your experience</h2>
            <p className="text-slate-700 text-lg font-semibold">Your feedback helps us improve the platform.</p>
          </motion.div>

          <motion.div 
            className="bg-white/90 backdrop-blur-lg rounded-3xl border border-white/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {feedbackSubmitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 mb-4">
                  <span className="text-white text-3xl">✓</span>
                </div>
                <h3 className="text-slate-900 text-2xl font-bold mb-2">Thank you!</h3>
                <p className="text-slate-700 font-semibold">Your feedback has been recorded.</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Rating Input */}
                <div>
                  <label className="block text-slate-900 text-sm font-bold mb-3 flex items-center gap-2">
                    <span>⭐ Your Rating</span>
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className={`text-4xl transition-all ${
                          star <= feedbackRating
                            ? 'text-amber-400 drop-shadow-lg'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        ★
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Feedback Textarea */}
                <div>
                  <label className="block text-slate-900 text-sm font-bold mb-3 flex items-center gap-2">
                    <span>📝 Your Feedback</span>
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you liked or what we can improve…"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-semibold text-base leading-relaxed resize-none"
                    rows={5}
                  />
                </div>

                {/* Feature Selection */}
                <div>
                  <label className="block text-slate-900 text-sm font-bold mb-3">What feature did you use?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Sports', 'Events', 'Gaming'].map((feature) => (
                      <motion.button
                        key={feature}
                        onClick={() => setFeedbackFeature(feature as 'Sports' | 'Events' | 'Gaming')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                          feedbackFeature === feature
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {feature}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-bold text-lg shadow-lg transition-all ${feedbackLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {feedbackLoading ? 'Submitting…' : 'Submit Feedback'}
                </motion.button>

                {feedbackError && (
                  <p className="text-sm text-rose-600 font-semibold">{feedbackError}</p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-black/40 to-black/60 backdrop-blur-sm">
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
                <h3 className="mb-3 text-white text-xl font-bold">{feature.title}</h3>
                <p className="text-white text-base font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Traction & Live Metrics */}
      <Traction />

      {/* Stats Section */}
      <section className="relative py-24">
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
                { value: "25,000", label: "Monthly Active Users" },
                { value: "42,000", label: "Matches Played" },
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
                  <p className="text-slate-900 text-xl md:text-2xl font-bold mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-24 bg-gradient-to-b from-black/40 to-transparent">
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
                  <span className="text-white text-lg font-semibold pr-4">{faq.question}</span>
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
                  <div className="px-6 pb-5 text-white text-base font-medium leading-relaxed">
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
            Join thousands experiencing sports, events, and gaming together.
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
            <span className="bg-gradient-to-r from-cyan-300 to-amber-200 bg-clip-text text-transparent text-2xl font-bold">Avento</span>
          </div>
          <p className="text-center text-white text-lg font-semibold">
            Where Every Moment Becomes a Memory.
          </p>
          <p className="text-center text-white text-base font-medium mt-2">
            Sports • Events • Gaming
          </p>
        </div>
      </footer>
    </div>
  );
}