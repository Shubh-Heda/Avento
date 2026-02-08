import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, Users, MapPin, CreditCard, Music, Heart, Sparkles, DollarSign, UserPlus, MessageCircle, Shield, Zap, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { communityService } from '../services/communityService';
import { PaymentModal } from './PaymentModal';
import chatService from '../services/chatService';

interface CreateEventBookingProps {
  onNavigate: (page: string, eventId?: string) => void;
  onEventBook: (event: any) => void;
  eventDetails?: {
    id: string;
    title: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    price: string;
    category: string;
  };
}

export function CreateEventBooking({ onNavigate, onEventBook, eventDetails }: CreateEventBookingProps) {
  const [step, setStep] = useState(1);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [showDirectPayment, setShowDirectPayment] = useState(false);
  const [bookingData, setBookingData] = useState({
    attendeeName: '',
    email: '',
    phone: '',
    numberOfTickets: 1,
    specialRequests: '',
    groupName: '',
    inviteMessage: '',
    visibility: 'public' as 'public' | 'friends' | 'private',
    createGroupChat: true,
  });

  const handleSubmit = () => {
    if (!bookingData.attendeeName || !bookingData.email || !bookingData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Show payment choice modal
    setShowPaymentChoice(true);
  };

  const handleDirectPayment = () => {
    setShowPaymentChoice(false);
    setShowDirectPayment(true);
  };

  const handleGroupPayment = async () => {
    setShowPaymentChoice(false);
    
    const pricePerTicket = parseInt(eventDetails?.price.replace('₹', '') || '0');
    const totalAmount = pricePerTicket * bookingData.numberOfTickets;

    const newEvent = {
      id: `event-${Date.now()}`,
      title: eventDetails?.title || 'Event',
      turfName: eventDetails?.venue || 'Venue',
      date: eventDetails?.date || '',
      time: eventDetails?.time || '',
      sport: eventDetails?.category || 'Cultural Event',
      status: 'upcoming' as const,
      visibility: bookingData.visibility.charAt(0).toUpperCase() + bookingData.visibility.slice(1),
      paymentOption: 'Per Person',
      amount: totalAmount,
      location: eventDetails?.location || '',
      image: eventDetails?.image,
      attendeeName: bookingData.attendeeName,
      numberOfTickets: bookingData.numberOfTickets,
      groupName: bookingData.groupName || `${eventDetails?.title} Group`,
      createGroupChat: bookingData.createGroupChat,
    };

    onEventBook(newEvent);
    
    // Post to community if visibility is public or friends
    if (bookingData.visibility === 'public' || bookingData.visibility === 'friends') {
      communityService.createPost({
        area: 'events',
        authorId: 'user_001',
        authorName: bookingData.attendeeName,
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${bookingData.attendeeName}`,
        title: `Looking for people to join ${eventDetails?.title}! 🎉`,
        content: `Hey everyone! I'm going to ${eventDetails?.title} at ${eventDetails?.venue} on ${eventDetails?.date} at ${eventDetails?.time}. ${bookingData.createGroupChat ? "I've created a group chat - join me and let's make this an amazing experience together! 🌟" : "Would love to meet fellow attendees there! 💫"}`,
        category: 'event',
      });
    }
    
    if (bookingData.createGroupChat) {
      try {
        // Create group chat for the event
        const groupName = bookingData.groupName || `${eventDetails?.title} Group`;
        const chatRoom = await chatService.createRoom({
          name: `${groupName} 🎭`,
          description: `Group chat for ${eventDetails?.title} at ${eventDetails?.venue} on ${eventDetails?.date}`,
          room_type: 'event',
          is_private: bookingData.visibility === 'private',
          category: 'events',
          related_id: newEvent.id,
          avatar_url: '🎭'
        });

        // Send welcome message
        await chatService.sendMessage(
          chatRoom.id,
          `🎭 Welcome to ${groupName}!\n\n🎪 Event: ${eventDetails?.title}\n📍 Venue: ${eventDetails?.venue}\n📅 Date: ${eventDetails?.date}\n⏰ Time: ${eventDetails?.time}\n\n👥 Total Tickets: ${bookingData.numberOfTickets}\n💰 Total Cost: ₹${totalAmount}\n\n${bookingData.inviteMessage || 'Get ready for an amazing cultural experience!'}\n\nConnect with fellow attendees, plan what to wear, and share your excitement! 🌟`,
          'system'
        );

        toast.success('Event Booked! Group Chat Created 🎉', {
          description: `You've booked ${bookingData.numberOfTickets} ticket(s). Opening group chat...`,
        });

        // Navigate to chat
        setTimeout(() => {
          onNavigate('events-chat', newEvent.id);
        }, 1500);
      } catch (error) {
        console.error('Error creating chat room:', error);
        toast.error('Event booked but chat creation failed. Please try again.');
      }
    } else {
      toast.success('Event booked successfully! 🎉', {
        description: `You've booked ${bookingData.numberOfTickets} ticket(s) for ${eventDetails?.title}`,
      });

      // Navigate to community feed
      setTimeout(() => {
        onNavigate('cultural-community');
      }, 1500);
    }
  };

  const totalPrice = parseInt((eventDetails?.price || '₹0').replace('₹', '')) * bookingData.numberOfTickets;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('events-dashboard')}
              className="hover:bg-purple-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Book Event
              </span>
              <p className="text-xs text-slate-600">Secure your spot & connect with attendees</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Preview Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-200 overflow-hidden mb-8">
          <div className="relative h-64">
            <ImageWithFallback
              src={eventDetails?.image || ''}
              alt={eventDetails?.title || 'Event'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="mb-2 text-white">{eventDetails?.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {eventDetails?.venue}, {eventDetails?.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {eventDetails?.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {eventDetails?.time}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step >= s
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 mx-1 transition-all ${
                    step > s ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="mb-2">Your Details</h2>
              <p className="text-slate-600">Let's start with your information</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-slate-700">Full Name *</label>
                <Input
                  placeholder="Enter your full name"
                  value={bookingData.attendeeName}
                  onChange={(e) => setBookingData({ ...bookingData, attendeeName: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-700">Email Address *</label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-700">Phone Number *</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-700">Number of Tickets *</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setBookingData({ ...bookingData, numberOfTickets: Math.max(1, bookingData.numberOfTickets - 1) })}
                    className="border-purple-300"
                  >
                    -
                  </Button>
                  <span className="text-2xl w-16 text-center">{bookingData.numberOfTickets}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setBookingData({ ...bookingData, numberOfTickets: Math.min(10, bookingData.numberOfTickets + 1) })}
                    className="border-purple-300"
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-1">Maximum 10 tickets per booking</p>
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-700">Special Requests (Optional)</label>
                <Textarea
                  placeholder="Any dietary requirements, accessibility needs, or special requests..."
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                  className="border-slate-300 min-h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={!bookingData.attendeeName || !bookingData.email || !bookingData.phone}
              >
                Next: Group Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Group & Community */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="mb-2">Connect with Attendees</h2>
              <p className="text-slate-600">Make friends and share the experience!</p>
            </div>

            <div className="space-y-6">
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2">Create Group Chat</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Connect with other attendees before, during, and after the event. Share excitement, coordinate meetups, and build lasting friendships! 💬
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="createGroupChat"
                        checked={bookingData.createGroupChat}
                        onChange={(e) => setBookingData({ ...bookingData, createGroupChat: e.target.checked })}
                        className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="createGroupChat" className="text-sm cursor-pointer">
                        Yes, create a group chat for this event
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {bookingData.createGroupChat && (
                <div>
                  <label className="block text-sm mb-2 text-slate-700">Group Name (Optional)</label>
                  <Input
                    placeholder={`${eventDetails?.title} Attendees`}
                    value={bookingData.groupName}
                    onChange={(e) => setBookingData({ ...bookingData, groupName: e.target.value })}
                    className="border-slate-300"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Default: "{eventDetails?.title} Group"
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2 text-slate-700">Visibility</label>
                <div className="space-y-3">
                  <button
                    onClick={() => setBookingData({ ...bookingData, visibility: 'public' })}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      bookingData.visibility === 'public'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-purple-600 mt-1" />
                      <div>
                        <div className="text-slate-900 mb-1">Public</div>
                        <p className="text-sm text-slate-600">
                          Anyone can see your booking and join the group chat
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setBookingData({ ...bookingData, visibility: 'friends' })}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      bookingData.visibility === 'friends'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-purple-600 mt-1" />
                      <div>
                        <div className="text-slate-900 mb-1">Friends Only</div>
                        <p className="text-sm text-slate-600">
                          Only your friends can see and join
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setBookingData({ ...bookingData, visibility: 'private' })}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      bookingData.visibility === 'private'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-600 mt-1" />
                      <div>
                        <div className="text-slate-900 mb-1">Private</div>
                        <p className="text-sm text-slate-600">
                          Only you can see this booking
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-purple-300"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Next: Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment & Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h2 className="mb-6">Booking Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-slate-600">Event</span>
                  <span>{eventDetails?.title}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-slate-600">Number of Tickets</span>
                  <span>{bookingData.numberOfTickets} × {eventDetails?.price}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-slate-600">Venue</span>
                  <span className="text-right">{eventDetails?.venue}, {eventDetails?.location}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-slate-600">Date & Time</span>
                  <span>{eventDetails?.date} at {eventDetails?.time}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-slate-600">Attendee</span>
                  <span>{bookingData.attendeeName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-slate-600">Visibility</span>
                  <Badge className="bg-purple-500">{bookingData.visibility}</Badge>
                </div>
                {bookingData.createGroupChat && (
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-slate-600">Group Chat</span>
                    <span className="text-purple-600">✓ Enabled</span>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Total Amount</span>
                  <span className="text-purple-600">₹{totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h2 className="mb-6">Payment Details</h2>

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm opacity-90">Amount to Pay</div>
                      <div className="text-2xl">₹{totalPrice}</div>
                    </div>
                  </div>
                  <Sparkles className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-sm text-white/90">
                  Secure payment powered by GameSetGo. Your payment information is encrypted and safe.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-slate-700">Card Number</label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    className="border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-slate-700">Expiry Date</label>
                    <Input
                      placeholder="MM/YY"
                      className="border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-slate-700">CVV</label>
                    <Input
                      placeholder="123"
                      type="password"
                      maxLength={3}
                      className="border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-slate-700">Cardholder Name</label>
                  <Input
                    placeholder="Name on card"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="text-sm text-slate-600">
                    <span className="text-slate-900">Secure Payment:</span> Your payment information is encrypted and securely processed. We never store your card details.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-purple-300"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
              >
                <UserCheck className="w-5 h-5" />
                Continue to Booking
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Choice Modal */}
      {showPaymentChoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setShowPaymentChoice(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h2 className="mb-2 text-slate-900">Choose Payment Method</h2>
              <p className="text-slate-600">Select how you'd like to book this event</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Direct Payment Option */}
              <button
                onClick={handleDirectPayment}
                className="group relative bg-gradient-to-br from-emerald-50 to-cyan-50 hover:from-emerald-100 hover:to-cyan-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-6 text-left transition-all hover:shadow-xl"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Pay Now</h3>
                    <p className="text-sm text-emerald-700 font-semibold">Instant Confirmation</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-700 mb-4">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Pay immediately and secure your spot
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Get instant booking confirmation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    No waiting for others
                  </li>
                </ul>
                <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center">
                  <p className="text-emerald-900 font-bold text-lg">₹{totalPrice}</p>
                  <p className="text-emerald-700 text-xs">Total Amount</p>
                </div>
              </button>

              {/* 5-Step Payment (Group) Option */}
              <button
                onClick={handleGroupPayment}
                className="group relative bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 hover:border-purple-400 rounded-2xl p-6 text-left transition-all hover:shadow-xl"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">5-Step Group Payment</h3>
                    <p className="text-sm text-purple-700 font-semibold">Connect & Share Cost</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-700 mb-4">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Create group & notify community
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Soft lock your spot for free
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Pay when minimum people join
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Meet attendees before the event
                  </li>
                </ul>
                <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 text-center">
                  <p className="text-purple-900 font-bold text-lg">FREE to Join</p>
                  <p className="text-purple-700 text-xs">Pay later when group forms</p>
                </div>
              </button>
            </div>

            <Button
              onClick={() => setShowPaymentChoice(false)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Direct Payment Modal */}
      {showDirectPayment && (
        <PaymentModal
          isOpen={showDirectPayment}
          onClose={() => setShowDirectPayment(false)}
          amount={totalPrice}
          itemName={`${eventDetails?.title} (${bookingData.numberOfTickets} ticket${bookingData.numberOfTickets > 1 ? 's' : ''})`}
          onPaymentSuccess={() => {
            setShowDirectPayment(false);
            toast.success('Payment Successful! 🎉', {
              description: 'Your booking is confirmed. Redirecting...',
            });
            setTimeout(() => {
              onNavigate('events-dashboard');
            }, 1500);
          }}
        />
      )}
    </div>
  );
}
