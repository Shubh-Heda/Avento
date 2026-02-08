import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { AventoLogo } from './AventoLogo';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthProvider';
import { Loader2, Trophy, Music, AlertCircle, LogOut, Gamepad2, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onBack?: () => void;
}

export function AuthPage({ onAuthSuccess, onBack }: AuthPageProps) {
  const { signIn, signInWithGoogle, user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demoUserReady, setDemoUserReady] = useState(false);
  const [initializingDemo, setInitializingDemo] = useState(false);

  // Initialize demo user on component mount (now using mock auth)
  useEffect(() => {
    // Mock initialization - demo user is always ready with mock auth
    setDemoUserReady(true);
    setInitializingDemo(false);
  }, []);

  const handleDemoLogin = async () => {
    setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await signIn('demo@avento.com', 'demo123');
        
        if (error) {
          console.error('Demo login error:', error);
          toast.error('Demo login failed. Please try creating a new account instead.');
        } else if (data) {
          toast.success('Welcome to the demo! 🎉');
          onAuthSuccess();
        }
      } catch (error: any) {
        console.error('Demo auth error:', error);
        toast.error('Demo login failed. Please try creating a new account.');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        console.error('Google sign in error:', error);
        toast.error(error.message || 'Failed to sign in with Google');
      } else if (data) {
        toast.success('Welcome! 🎉');
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-purple-50 to-orange-50 flex items-center justify-center p-4 relative">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 p-2 hover:bg-white rounded-lg transition-colors group"
          title="Back to Landing Page"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:text-cyan-600 transition-colors" />
        </button>
      )}
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-purple-400/20 to-orange-400/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-white shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <AventoLogo size="lg" variant="icon-only" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
                    AVENTO
                  </h1>
                  <p className="text-sm text-slate-500">Matchmaking the Sport of Friendships</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 mb-1">Sports & Turf</h3>
                    <p className="text-sm text-slate-600">
                      Book turfs, create matches, and build lasting friendships through sports
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 mb-1">Events</h3>
                    <p className="text-sm text-slate-600">
                      Discover concerts, festivals, and standout experiences with your community
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 mb-1">Gaming</h3>
                    <p className="text-sm text-slate-600">
                      Join gaming sessions, tournaments, and find your squad
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-xl border border-cyan-200">
                <p className="text-sm text-slate-700">
                  ✨ Trust Scores • 🔥 Friendship Streaks • 💬 Real-time Chat • 🎯 Smart Matching
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth form or Email Display */}
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
            {user ? (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-purple-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold">Welcome! 👋</h2>
                  <div className="bg-gradient-to-r from-cyan-50 to-purple-50 rounded-lg p-4 mb-6 border border-cyan-200">
                    <p className="text-sm text-slate-600 mb-1">Logged in as</p>
                    <p className="text-lg font-semibold text-slate-900 break-all">{user.email}</p>
                    {user.name && <p className="text-sm text-slate-600 mt-2">Name: {user.name}</p>}
                  </div>
                  <p className="text-slate-600 mb-6">You're all set! Click below to continue to the app.</p>
                </div>
                <Button
                  type="button"
                  onClick={onAuthSuccess}
                  className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 hover:from-cyan-600 hover:via-purple-600 hover:to-orange-600 text-white mb-3"
                >
                  Continue to App
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    toast.success('Logged out successfully');
                  }}
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <h2 className="mb-2">Welcome Back!</h2>
                  <p className="text-slate-600">Sign in to continue your journey</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <span className="text-xs text-slate-500">AUTH OPTIONS</span>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>

                  {/* Google Sign In Button */}
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <image href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTIyLjU2IDEyLjI1YzAtLjYxLS4wNS0xLjIxLS4xNi0xLjc5SDEydjMuMzloNC44NGMtLjIgMS4wOC0uODIgMi4wMS0xLjc0IDIuNjF2Mi4xN2g0LjY5YzEuNjgtMS41NSAyLjY0LTMuODMgMi42NC02LjU5eiIgZmlsbD0iIzQyODVGNCIvPjxwYXRoIGQ9Ik0xMiAyMi41YzIuMjcgMCA0LjE3LS43NCA1LjU2LTIuMDNsLTQuNjktMy42MWMtLjc3LjUyLTEuNzcuODItMi44Ny44Mi0yLjIgMC00LjA2LTEuNDgtNC42OS0zLjQ3SDIuMTh2Mi4yM0MzLjU3IDIwLjc4IDcuNDMgMjIuNSAxMiAyMi41eiIgZmlsbD0iIzM0QTg1MyIvPjxwYXRoIGQ9Ik03LjMxIDE0LjdjLS40Ni0uMzItLjc2LS44Mi0uNzYtMS40M3MuMy0xLjExLjc2LTEuNDNWOS4wN0gyLjE4Yy0uNDQuODktLjcgMS45LS43IDIuOTdzLjI2IDIuMDguNyAyLjk3bDQuNDctMy4zN3oiIGZpbGw9IiNGQkJDMDQiLz48cGF0aCBkPSJNMTIgNS4zOGMxLjI0IDAgMi4zNS40MiAzLjIyIDEuMjRsNC4xOC00LjE4QzE2LjE2IDEuMDIgMTQuMTMgMCAxMiAwYy00LjU3IDAtOC40MyAxLjY5LTExLjM2IDQuNDdMNS4zIDcuMDdjLjYzLTEuOTkgMi40OS0zLjM2IDQuNy0zLjM2eiIgZmlsbD0iI0VBNDMzNSIvPjwvc3ZnPg==" width="24" height="24" />
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </Button>

                  {/* Demo credentials */}
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-blue-900 mb-1">
                            <strong>Try Demo Account (Shubh's Profile)</strong>
                          </p>
                          <p className="text-xs text-blue-700 font-mono">
                            Email: demo@avento.com<br/>
                            Password: demo123
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            ✨ Full access to all features with pre-loaded data
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={loading || initializingDemo || !demoUserReady}
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      {initializingDemo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up demo...
                        </>
                      ) : !demoUserReady ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Preparing demo...
                        </>
                      ) : (
                        '🎮 Try Demo Account'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}