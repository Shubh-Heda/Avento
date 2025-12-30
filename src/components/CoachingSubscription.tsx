import { useState, useEffect } from 'react';
import { X, Award, Calendar, Clock, Users, Star, CheckCircle, TrendingUp, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import {
  getAvailableTimeSlots,
  bookCoachingSlot,
  createCoachingSubscription,
  getNext7Days,
  type Coach as CoachType
} from '../services/coachingService';

interface Coach {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  reviews: number;
  experience: string;
  image: string;
  bio: string;
  specializations: string;
}

interface CoachingSlot {
  id: string;
  day: string;
  time: string;
  duration: string;
  available: boolean;
  spotsLeft: number;
}

interface CoachingSubscriptionProps {
  turfName: string;
  sport: string;
  onClose: () => void;
  coaches: Coach[];
  slots: CoachingSlot[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  sessions: number;
  features: string[];
  recommended?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2999,
    duration: '1 Month',
    sessions: 8,
    features: [
      '8 coaching sessions',
      'Group training (max 6 people)',
      'Basic skill assessment',
      'Weekly progress reports',
      'Access to training materials',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 7999,
    duration: '3 Months',
    sessions: 24,
    features: [
      '24 coaching sessions',
      'Semi-private training (max 3 people)',
      'Comprehensive skill assessment',
      'Bi-weekly progress reports',
      'Personalized training plan',
      'Video analysis of your gameplay',
      'Nutrition guidance',
      'Priority booking',
    ],
    recommended: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 14999,
    duration: '6 Months',
    sessions: 48,
    features: [
      '48 coaching sessions',
      'One-on-one training',
      'Advanced skill & fitness assessment',
      'Weekly detailed progress reports',
      'Fully personalized training program',
      'Full video analysis suite',
      'Nutrition & fitness guidance',
      'Priority booking & flexible rescheduling',
      'Access to special workshops',
      'Tournament preparation',
    ],
  },
];

export function CoachingSubscription({
  turfName,
  sport,
  onClose,
  coaches,
  slots,
}: CoachingSubscriptionProps) {
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [step, setStep] = useState<'coaches' | 'plans' | 'slots' | 'confirm'>('coaches');
  
  // Calendar integration state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const coach = coaches.find(c => c.id === selectedCoach);
  const plan = subscriptionPlans.find(p => p.id === selectedPlan);

  // Initialize available dates (next 7 days)
  useEffect(() => {
    setAvailableDates(getNext7Days());
  }, []);

  // Load available time slots when coach and date change
  useEffect(() => {
    if (selectedCoach && selectedDate) {
      loadAvailableTimeSlots();
    }
  }, [selectedCoach, selectedDate]);

  const loadAvailableTimeSlots = async () => {
    if (!selectedCoach) return;

    setIsLoadingSlots(true);
    try {
      const slots = await getAvailableTimeSlots(selectedCoach, selectedDate);
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      // Fallback to mock data if backend is not available
      const mockSlots = [
        {
          id: 'mock-1',
          coach_id: selectedCoach,
          day_of_week: selectedDate.getDay(),
          start_time: '06:00',
          end_time: '07:30',
          duration_minutes: 90,
          spots_left: 4,
          is_available: true,
          sport: sport,
        },
        {
          id: 'mock-2',
          coach_id: selectedCoach,
          day_of_week: selectedDate.getDay(),
          start_time: '17:00',
          end_time: '18:30',
          duration_minutes: 90,
          spots_left: 2,
          is_available: true,
          sport: sport,
        },
        {
          id: 'mock-3',
          coach_id: selectedCoach,
          day_of_week: selectedDate.getDay(),
          start_time: '18:30',
          end_time: '20:00',
          duration_minutes: 90,
          spots_left: 6,
          is_available: true,
          sport: sport,
        },
      ];
      setAvailableTimeSlots(mockSlots);
      console.log('Using mock time slots (backend not available)');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    setSelectedSlots(prev =>
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const handleSubscribe = async () => {
    if (!selectedCoach || !selectedPlan || selectedSlots.length === 0) {
      toast.error('Please complete all selections');
      return;
    }

    try {
      // Create subscription
      const subscription = await createCoachingSubscription(
        selectedCoach,
        selectedPlan,
        new Date()
      );

      // Book initial slots
      for (const slotId of selectedSlots) {
        await bookCoachingSlot(
          selectedCoach,
          slotId,
          selectedDate,
          subscription.id,
          0 // Included in subscription
        );
      }

      toast.success(`Successfully subscribed to ${plan?.name} coaching plan! 🎉`, {
        description: `Your ${sport} coaching journey begins now!`,
      });
      onClose();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-1">Coaching Subscription</h2>
              <p className="text-slate-600">
                {turfName} • {sport}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`flex-1 h-2 rounded-full ${step === 'coaches' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : selectedCoach ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step === 'plans' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : selectedPlan ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step === 'slots' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : selectedSlots.length > 0 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step === 'confirm' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : 'bg-slate-200'}`} />
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Select Coach */}
          {step === 'coaches' && (
            <div>
              <div className="mb-6">
                <h3 className="mb-2">Choose Your Coach</h3>
                <p className="text-slate-600">
                  Select an experienced coach who matches your goals
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {coaches.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => setSelectedCoach(coach.id)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selectedCoach === coach.id
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <ImageWithFallback
                        src={coach.image}
                        alt={coach.name}
                        className="w-20 h-20 rounded-full object-cover shadow-md"
                      />
                      <div className="flex-1">
                        <h3 className="mb-1">{coach.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm">{coach.rating}</span>
                          </div>
                          <span className="text-sm text-slate-600">
                            ({coach.reviews} reviews)
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {coach.experience} Experience
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 mb-3">{coach.bio}</p>

                    <div className="mb-3">
                      <p className="text-xs text-slate-600 mb-2">Expertise:</p>
                      <div className="flex flex-wrap gap-1">
                        {coach.expertise.map(skill => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs bg-emerald-100 text-emerald-700"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">{coach.specializations}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setStep('plans')}
                  disabled={!selectedCoach}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
                >
                  Next: Choose Plan
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Plan */}
          {step === 'plans' && (
            <div>
              <div className="mb-6">
                <h3 className="mb-2">Select Subscription Plan</h3>
                <p className="text-slate-600">
                  Choose the plan that best fits your training goals with {coach?.name}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {subscriptionPlans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                      selectedPlan === plan.id
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg scale-105'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    } ${plan.recommended ? 'ring-2 ring-purple-300' : ''}`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3 className="mb-2">{plan.name}</h3>
                      <div className="mb-1">
                        <span className="text-cyan-600">₹{plan.price}</span>
                      </div>
                      <p className="text-sm text-slate-600">{plan.duration}</p>
                    </div>

                    <div className="mb-4 p-3 bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-lg text-center">
                      <p className="text-sm">
                        <span>{plan.sessions} Sessions</span>
                        <br />
                        <span className="text-xs text-slate-600">
                          ≈ ₹{Math.round(plan.price / plan.sessions)}/session
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      {plan.features.map(feature => (
                        <div key={feature} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep('coaches')}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('slots')}
                  disabled={!selectedPlan}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
                >
                  Next: Select Time Slots
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Select Slots */}
          {step === 'slots' && (
            <div>
              <div className="mb-6">
                <h3 className="mb-2">Choose Your Training Schedule</h3>
                <p className="text-slate-600">
                  Select date and preferred time slots (you can select multiple)
                </p>
              </div>

              {/* Date Selector */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Select Date</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableDates.map((date, index) => {
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNumber = date.getDate();
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                    const isToday = new Date().toDateString() === date.toDateString();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm text-slate-600 mb-1">{dayName}</div>
                        <div className="text-2xl font-bold text-slate-900">{dayNumber}</div>
                        <div className="text-xs text-slate-600 mt-1">{monthName}</div>
                        {isToday && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            Today
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Time Slots */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Available Time Slots</h4>
                
                {isLoadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600">Loading available slots...</p>
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No available slots for this date</p>
                    <p className="text-sm text-slate-500 mt-1">Try selecting another date</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {availableTimeSlots.map((timeSlot, index) => {
                      // Handle both old format (time, spotsLeft, available) and new format (start_time, end_time, spots_left, is_available)
                      const displayTime = timeSlot.time || `${timeSlot.start_time} - ${timeSlot.end_time}`;
                      const spotsAvailable = timeSlot.spotsLeft !== undefined ? timeSlot.spotsLeft : timeSlot.spots_left;
                      const isSlotAvailable = timeSlot.available !== undefined ? timeSlot.available : timeSlot.is_available;
                      const slotId = timeSlot.id || `${selectedDate.toISOString()}-${timeSlot.start_time || timeSlot.time}`;
                      const isSelected = selectedSlots.includes(slotId);
                      
                      return (
                        <button
                          key={index}
                          onClick={() => isSlotAvailable && toggleSlot(slotId)}
                          disabled={!isSlotAvailable}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-50 shadow-md'
                              : isSlotAvailable
                              ? 'border-slate-200 hover:border-slate-300'
                              : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-cyan-600" />
                              <span className="font-semibold">{displayTime}</span>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>

                          {isSlotAvailable ? (
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <Users className="w-3 h-3" />
                              <span>{spotsAvailable} spots available</span>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Fully Booked
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedSlots.length > 0 && (
                <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
                  <p className="text-sm text-cyan-700">
                    {selectedSlots.length} time slot{selectedSlots.length > 1 ? 's' : ''} selected for{' '}
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep('plans')}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={selectedSlots.length === 0}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
                >
                  Review & Confirm
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && coach && plan && (
            <div>
              <div className="mb-6">
                <h3 className="mb-2">Confirm Your Subscription</h3>
                <p className="text-slate-600">
                  Review your selections before subscribing
                </p>
              </div>

              <div className="space-y-6">
                {/* Coach Summary */}
                <div className="bg-gradient-to-br from-cyan-50 to-emerald-50 rounded-xl p-6 border border-cyan-200">
                  <h3 className="text-cyan-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Your Coach
                  </h3>
                  <div className="flex items-center gap-4">
                    <ImageWithFallback
                      src={coach.image}
                      alt={coach.name}
                      className="w-16 h-16 rounded-full object-cover shadow-md"
                    />
                    <div>
                      <h3 className="mb-1">{coach.name}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{coach.rating}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {coach.experience}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Summary */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-purple-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {plan.name} Plan
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-purple-700 mb-1">Duration</p>
                      <p className="text-purple-900">{plan.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 mb-1">Sessions</p>
                      <p className="text-purple-900">{plan.sessions} sessions</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-purple-200">
                    <p className="text-sm text-purple-700 mb-1">Total Investment</p>
                    <p className="text-purple-900">₹{plan.price}</p>
                  </div>
                </div>

                {/* Slots Summary */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="text-orange-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Your Training Schedule
                  </h3>
                  <div className="mb-3 p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold">
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedSlots.map((slotId, index) => {
                      const timeSlot = availableTimeSlots.find(
                        ts => `${selectedDate.toISOString()}-${ts.time}` === slotId
                      );
                      return timeSlot ? (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span>{timeSlot.time}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {timeSlot.spotsLeft} spots left
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-blue-900 mb-2">What's Next?</h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Your coach will contact you within 24 hours</li>
                        <li>• Initial assessment will be scheduled</li>
                        <li>• Personalized training plan will be created</li>
                        <li>• You can reschedule sessions as needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep('slots')}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubscribe}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Subscribe Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
