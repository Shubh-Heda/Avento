import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthProvider';

interface OnboardingFormProps {
  onComplete: () => void;
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: '',
    phone: '',
    email: user?.email || '',
    profession: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.age || !formData.phone || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isNaN(Number(formData.age)) || Number(formData.age) < 13) {
      toast.error('Please enter a valid age');
      return;
    }

    setLoading(true);

    try {
      // Update email if it changed
      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) throw emailError;
      }

      // Update user metadata in Supabase with onboarding_completed = true
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          age: formData.age,
          phone: formData.phone,
          profession: formData.profession || 'Not specified',
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        },
      });

      if (error) throw error;

      // Also save to a profiles table if you want to query this data easily
      if (user?.id) {
        try {
          const { error: dbError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                name: formData.name,
                age: Number(formData.age),
                phone: formData.phone,
                email: formData.email,
                profession: formData.profession || 'Not specified',
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (dbError && dbError.code !== 'PGRST116') {
            console.warn('Profile table might not exist:', dbError);
          }
        } catch (tableError) {
          console.warn('Could not save to profiles table:', tableError);
        }
      }

      toast.success('Profile completed! Welcome aboard! 🎉');
      
      // Refresh the session to ensure user object is updated with new metadata
      await supabase.auth.refreshSession();
      
      // Wait a moment for the user object to update in the parent component
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Form container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
            <p className="text-slate-400">Just a few details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-slate-300 text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                disabled={loading}
                className="mt-2 bg-slate-700/30 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Age */}
            <div>
              <Label htmlFor="age" className="text-slate-300 text-sm font-medium">
                Age <span className="text-red-500">*</span>
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Your age"
                disabled={loading}
                min="13"
                className="mt-2 bg-slate-700/30 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-slate-300 text-sm font-medium">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Your phone number"
                disabled={loading}
                className="mt-2 bg-slate-700/30 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email address"
                disabled={loading}
                className="mt-2 bg-slate-700/30 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Profession */}
            <div>
              <Label htmlFor="profession" className="text-slate-300 text-sm font-medium">
                Profession <span className="text-slate-500 text-xs">(Optional)</span>
              </Label>
              <Input
                id="profession"
                name="profession"
                type="text"
                value={formData.profession}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer, Student, etc."
                disabled={loading}
                className="mt-2 bg-slate-700/30 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Profile
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Your profile helps us personalize your experience
          </p>
        </div>
      </div>
    </div>
  );
}
