// src/lib/googleDrive.ts

import { drive_v3 } from 'googleapis';
import { getDriveClient } from './googleAuth';
import { logger } from '@/utils/logger';

export async function getDriveClientInstance(): Promise<drive_v3.Drive> {
  logger.info('🔑 Getting Google Drive client instance');

  try {
    const drive = await getDriveClient();
    logger.info('✅ Google Drive client instance retrieved successfully');
    return drive;
  } catch (error: any) {
    logger.error('❌ Failed to get Google Drive client instance', { error: error.message });
    throw error;
  }
}

export async function listFilesInFolder(folderId: string) {
  logger.info('📥 Listing files in folder', { folderId });

  try {
    const drive = await getDriveClient();

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });

    const files = res.data.files || [];
    logger.info(`📂 Found ${files.length} file(s) in folder`, { folderId });

    return files;
  } catch (error: any) {
    logger.error('❌ Failed to list files in folder', { folderId, error: error.message });
    throw error;
  }
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  logger.info('⬇️ Downloading file from Google Drive', { fileId });

  try {
    const drive = await getDriveClient();

    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    logger.info('✅ File downloaded successfully', { fileId });

    return Buffer.from(res.data as ArrayBuffer);
  } catch (error: any) {
    logger.error('❌ Failed to download file', { fileId, error: error.message });
    throw error;
  }
}
