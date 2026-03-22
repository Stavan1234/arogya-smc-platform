// lib/firebase.ts
import admin from 'firebase-admin';

// Initialize once
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } else {
    // Fallback: use default credentials (e.g., on Google Cloud)
    admin.initializeApp();
  }
}

/**
 * Send a push notification to multiple device tokens.
 * @param tokens - Array of FCM registration tokens (max 500)
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional custom data (key-value strings)
 */
export async function sendMulticast(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!tokens.length) return;

  const message = {
    notification: { title, body },
    data: data || {},
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);
    if (response.failureCount > 0) {
      const failedTokens = response.responses
        .filter((resp, idx) => !resp.success)
        .map((_, idx) => tokens[idx]);
      console.error('Failed tokens:', failedTokens);
      // Optionally store failed tokens for retry
    }
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    throw error;
  }
}