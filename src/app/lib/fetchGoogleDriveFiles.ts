import { drive_v3 } from 'googleapis';
import { getDriveClient } from './googleAuth';

export const fetchGoogleDriveFiles = async (folderId: string) => {
  const drive = await getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
  });

  return res.data.files || [];
};
