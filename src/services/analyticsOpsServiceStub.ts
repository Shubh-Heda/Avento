// ============================================
// Analytics & Ops Service - DEPRECATED
// Maintained for backward compatibility - functionality moved to Supabase
// ============================================

export const analyticsService = {
  trackEvent: async (_eventName: string, _eventData?: any) => {
    console.log('[ANALYTICS STUB] Event tracked:', _eventName);
    return { error: null };
  },

  trackPageView: async (_pageName: string) => {
    console.log('[ANALYTICS STUB] Page view tracked:', _pageName);
    return { error: null };
  },

  getAnalytics: async () => {
    return { data: [], error: null };
  }
};

export class AnalyticsOpsService {
  async trackEvent(_eventName: string, _properties: any) {
    console.log('[ANALYTICS STUB] Event:', _eventName);
  }

  async logStructured(_level: string, _message: string, _metadata?: any) {
    console.log('[ANALYTICS STUB] Log:', _message);
  }

  async recordSyntheticCheck(_payload: any) {
    console.log('[ANALYTICS STUB] Synthetic check recorded');
  }

  async getRecentErrors(_limit = 20) {
    return { data: [], error: null };
  }
}

export const analyticsOpsService = new AnalyticsOpsService();
export default analyticsOpsService;
