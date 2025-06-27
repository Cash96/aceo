// src/lib/googleDrive.ts

import { drive_v3, google } from 'googleapis';
import { getDriveClient } from './googleAuth'; //

export async function getDriveClientInstance(): Promise<drive_v3.Drive> {
  const drive = await getDriveClient();
  return drive;
}

export async function listFilesInFolder(folderId: string) {
  const drive = await getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });

  return res.data.files || [];
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = await getDriveClient();

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(res.data as ArrayBuffer);
}
