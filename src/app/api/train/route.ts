// src/app/api/train/route.ts
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getDriveClient } from '@/app/lib/googleAuth';
import {
  uploadFileToOpenAI,
  attachFileToVectorStore,
  deleteFileFromVectorStore,
  deleteFileFromOpenAI,
} from '@/app/lib/openai';
import { FileRecord } from '@/app/models/FileRecords';
import { connectMongo } from '@/app/lib/mongobd';

export async function POST(req: NextRequest) {
  const { department, folderId, vectorStoreId } = await req.json();

  if (!folderId || !vectorStoreId) {
    return new Response('Missing folderId or vectorStoreId', { status: 400 });
  }

  try {
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const drive = await getDriveClient();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, modifiedTime)',
      supportsAllDrives: true,
    });

    const files = response.data.files || [];
    console.log(`📂 Found ${files.length} file(s) in ${department} folder`);

    for (const file of files) {
      if (!file.id || !file.name || !file.modifiedTime) continue;

      const lastModified = new Date(file.modifiedTime);
      const existing = await FileRecord.findOne({ googleId: file.id });

      if (existing) {
        const unchanged = new Date(existing.lastModified).getTime() === lastModified.getTime();
        if (unchanged) {
          console.log(`⏩ Skipping ${file.name} (no changes)`);
          continue;
        }

        console.log(`🔁 Reprocessing ${file.name} (modified since last upload)`);

        // 🧹 Step 1: Remove old file from vector store
        await deleteFileFromVectorStore(existing.vectorStoreId, existing.openaiId);

        // 🧹 Step 2: Delete old file from OpenAI
        await deleteFileFromOpenAI(existing.openaiId);
      } else {
        console.log(`🆕 New file detected: ${file.name}`);
      }

      // 📥 Step 3: Download file
      let buffer: Buffer;
      const mimeType = file.mimeType || '';

      if (mimeType.startsWith('application/vnd.google-apps')) {
        const exported = await drive.files.export(
          { fileId: file.id, mimeType: 'text/plain' },
          { responseType: 'arraybuffer' }
        );
        buffer = Buffer.from(exported.data as ArrayBuffer);
      } else {
        const fileContent = await drive.files.get(
          { fileId: file.id, alt: 'media', supportsAllDrives: true },
          { responseType: 'arraybuffer' }
        );
        buffer = Buffer.from(fileContent.data as ArrayBuffer);
      }

      // 📝 Step 4: Prepare file name
      let safeFileName = file.name;
      if (!safeFileName.includes('.')) safeFileName += '.txt';

      // ⬆️ Step 5: Upload to OpenAI
      const openaiId = await uploadFileToOpenAI(buffer, safeFileName);
      console.log(`✅ Uploaded ${safeFileName} to OpenAI as ${openaiId}`);

      // 🔗 Step 6: Attach to vector store
      await attachFileToVectorStore(vectorStoreId, openaiId);
      console.log(`🔗 Attached ${safeFileName} to vector store ${vectorStoreId}`);

      // 💾 Step 7: Save or update record in MongoDB
      await FileRecord.findOneAndUpdate(
        { googleId: file.id },
        {
          name: safeFileName,
          googleId: file.id,
          openaiId,
          lastModified,
          department,
          vectorStoreId,
          uploadedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      if (existing) {
        console.log(`📘 Updated DB record for ${safeFileName}`);
      } else {
        console.log(`📗 Created new DB record for ${safeFileName}`);
      }
    }

    return Response.json({ message: `✅ Training for ${department} completed` });
  } catch (error: any) {
    console.error('❌ Training error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
