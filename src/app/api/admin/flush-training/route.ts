// src/app/api/admin/flush-training/route.ts
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { connectMongo } from '@/app/lib/mongobd';
import { FileRecord } from '@/app/models/FileRecords';
import {
  deleteFileFromVectorStore,
  deleteFileFromOpenAI,
} from '@/app/lib/openai';

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const allRecords = await FileRecord.find();

    console.log(`🧹 Flushing ${allRecords.length} records...`);

    for (const record of allRecords) {
      if (record.vectorStoreId && record.openaiId) {
        await deleteFileFromVectorStore(record.vectorStoreId, record.openaiId);
        await deleteFileFromOpenAI(record.openaiId);
        console.log(`❌ Removed ${record.name}`);
      }
    }

    await FileRecord.deleteMany();
    console.log('✅ MongoDB flushed');

    return Response.json({ success: true, message: 'Training data deleted' });
  } catch (error: any) {
    console.error('❌ Flush error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
