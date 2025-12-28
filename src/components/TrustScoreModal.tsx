// ============================================
// Trust Score Modal - View Detailed Scores
// ============================================
import { useEffect, useState } from 'react';
import { X, Shield, TrendingUp, Users, Award, Star, Clock, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import trustScoreService from '../services/trustScoreService';
import type { TrustScore, TrustScoreHistory, Achievement } from '../services/trustScoreService';

interface TrustScoreModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TrustScoreModal({ userId, isOpen, onClose }: TrustScoreModalProps) {
  const [score, setScore] = useState<TrustScore | null>(null);
  const [history, setHistory] = useState<TrustScoreHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements'>('overview');

  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userScore, scoreHistory, userAchievements] = await Promise.all([
        trustScoreService.getUserScore(userId),
        trustScoreService.getScoreHistory(userId, 20),
        trustScoreService.getUserAchievements(userId)
      ]);
      setScore(userScore);
      setHistory(scoreHistory);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error loading trust score data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const scoreBadge = score ? trustScoreService.getScoreBadge(score.overall_score) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-600" />
              Trust & Reliability Score
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Behavior, reliability, and community engagement metrics
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading trust score...</p>
            </div>
          </div>
        ) : score ? (
          <>
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-slate-600 hover:text-cyan-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-slate-600 hover:text-cyan-600'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'achievements'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-slate-600 hover:text-cyan-600'
                }`}
              >
                Achievements ({achievements.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center py-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl">
                    <div className="text-6xl font-bold text-cyan-600 mb-2">
                      {score.overall_score}
                    </div>
                    {scoreBadge && (
                      <Badge className={`${scoreBadge.color} text-lg px-4 py-1`}>
                        {scoreBadge.label}
                      </Badge>
                    )}
                    <p className="text-sm text-slate-600 mt-3">
                      Level {score.level} • {score.experience_points} XP
                    </p>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-900">Reliability</span>
                      </div>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {score.reliability_score}
                      </div>
                      <div className="space-y-1 text-sm text-green-700">
                        <div>Attendance: {score.attendance_rate.toFixed(0)}%</div>
                        <div>On-time: {score.on_time_rate.toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Behavior</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {score.behavior_score}
                      </div>
                      <div className="space-y-1 text-sm text-blue-700">
                        <div>👍 {score.positive_feedback_count} positive</div>
                        <div>👎 {score.negative_feedback_count} negative</div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Community</span>
                      </div>
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {score.community_score}
                      </div>
                      <div className="space-y-1 text-sm text-purple-700">
                        <div>Posts: {score.posts_count}</div>
                        <div>Helpful: {score.helpful_count}</div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-600" />
                        Activity
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Matches Attended:</span>
                          <span className="font-semibold">{score.matches_attended}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Matches Organized:</span>
                          <span className="font-semibold">{score.matches_organized}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Current Streak:</span>
                          <span className="font-semibold flex items-center gap-1">
                            🔥 {score.current_streak} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Longest Streak:</span>
                          <span className="font-semibold">{score.longest_streak} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-cyan-600" />
                        Status
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Verified:</span>
                          <Badge className={score.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {score.is_verified ? '✓ Verified' : 'Not Verified'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cancellation Rate:</span>
                          <span className="font-semibold">{score.cancellation_rate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Reports Received:</span>
                          <span className={`font-semibold ${score.reports_received > 0 ? 'text-red-600' : ''}`}>
                            {score.reports_received}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Warnings:</span>
                          <span className={`font-semibold ${score.warnings_count > 0 ? 'text-orange-600' : ''}`}>
                            {score.warnings_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {history.length > 0 ? (
                    history.map((entry) => (
                      <div key={entry.id} className="bg-white rounded-lg border p-4 flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          entry.change_amount > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <TrendingUp className={`w-5 h-5 ${
                            entry.change_amount > 0 ? 'text-green-600' : 'text-red-600 rotate-180'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <div className="font-semibold text-slate-900">{entry.reason}</div>
                              <div className="text-sm text-slate-600 capitalize">{entry.score_type.replace('_', ' ')}</div>
                            </div>
                            <div className={`text-xl font-bold ${
                              entry.change_amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.change_amount > 0 ? '+' : ''}{entry.change_amount}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No history yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.length > 0 ? (
                    achievements.map((achievement) => (
                      <div key={achievement.id} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-amber-900 mb-1">
                              {achievement.name}
                            </div>
                            <p className="text-sm text-amber-700 mb-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge className="bg-amber-200 text-amber-900">
                                +{achievement.points} XP
                              </Badge>
                              {achievement.earned_at && (
                                <span className="text-xs text-amber-600">
                                  {new Date(achievement.earned_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 text-slate-500">
                      <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No achievements yet</p>
                      <p className="text-sm mt-1">Keep participating to earn badges!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-slate-50 text-center text-sm text-slate-600">
              Trust scores are calculated based on reliability, behavior, and community engagement
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center text-slate-500">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No trust score data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
