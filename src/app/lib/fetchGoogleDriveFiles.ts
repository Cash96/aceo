import { drive_v3 } from 'googleapis';
import { getDriveClient } from './googleAuth';
import { logger } from '@/utils/logger';

export const fetchGoogleDriveFiles = async (folderId: string) => {
  logger.info('📥 Fetching Google Drive files', { folderId });

  try {
    const drive = await getDriveClient();

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
    });

    const files = res.data.files || [];
    logger.info(`📂 Found ${files.length} file(s) in Google Drive folder`, { folderId });

    return files;
  } catch (error: any) {
    logger.error('❌ Failed to fetch Google Drive files', { folderId, error: error.message });
    throw error;
  }
};
