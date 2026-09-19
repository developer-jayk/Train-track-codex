// Base API URL configured via Vite environment variable
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface FeedbackData {
  name?: string;
  email?: string;
  feedbackType: string;
  rating: number;
  message: string;
  trainNumber?: string;
  journeyDate?: string;
  boardingStation?: string;
}

export interface FeedbackSubmissionResult {
  success: boolean;
  message: string;
  deliveryId?: string;
  provider?: string;
  isBackendConnected: boolean;
}

/**
 * Service abstraction for submitting passenger feedback.
 * Strictly communicates with backend POST /api/v1/feedback to execute email delivery.
 * Does NOT simulate success.
 */
export const feedbackService = {
  /**
   * Submit feedback to the Python backend which dispatches transactional email to npb.sahej@gmail.com.
   */
  async submitFeedback(data: FeedbackData): Promise<FeedbackSubmissionResult> {
    const cleanMessage = (data.message || '').trim();
    if (!cleanMessage) {
      throw new Error('Please enter a feedback message.');
    }

    const payload = {
      name: (data.name || '').trim() || null,
      email: (data.email || '').trim() || null,
      feedback_type: data.feedbackType || 'General Feedback',
      feedbackType: data.feedbackType || 'General Feedback',
      rating: Math.min(5, Math.max(1, data.rating || 5)),
      message: cleanMessage,
      train_number: (data.trainNumber || '').trim() || null,
      trainNumber: (data.trainNumber || '').trim() || null,
      journey_date: (data.journeyDate || '').trim() || null,
      journeyDate: (data.journeyDate || '').trim() || null,
      boarding_station: (data.boardingStation || '').trim().toUpperCase() || null,
      boardingStation: (data.boardingStation || '').trim().toUpperCase() || null,
    };

    const feedbackEndpoint = `${API_BASE_URL}/api/v1/feedback`;

    try {
      const response = await fetch(feedbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json();
        return {
          success: true,
          message: resData.message || 'Your feedback has been sent successfully.',
          deliveryId: resData.delivery_id,
          provider: resData.provider,
          isBackendConnected: true,
        };
      }

      let errorDetail = 'Unable to send feedback. Please try again.';
      try {
        const errorJson = await response.json();
        if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail) && errorJson.detail[0]?.msg) {
          errorDetail = errorJson.detail[0].msg;
        }
      } catch {
        // Use default error string
      }

      return {
        success: false,
        message: errorDetail,
        isBackendConnected: true,
      };
    } catch (err: any) {
      console.error('[feedbackService] Network or backend connection error:', err);
      return {
        success: false,
        message: 'Unable to send feedback. Please try again.',
        isBackendConnected: false,
      };
    }
  },
};
