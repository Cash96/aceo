import { google } from 'googleapis';
import { logger } from '@/utils/logger';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export async function getDriveClient() {
  logger.info('🔑 Initializing Google Drive client');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });

    logger.info('✅ Google Drive authentication configured');

    const drive = google.drive({ version: 'v3', auth });
    logger.info('📂 Google Drive client created successfully');

    return drive;
  } catch (error: any) {
    logger.error('❌ Failed to initialize Google Drive client', { error: error.message });
    throw error;
  }
}
