import axios from 'axios';
import FormData from 'form-data';
import { logger } from '@/utils/logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_API_BASE = 'https://api.openai.com/v1';

const jsonHeaders = {
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
};

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function uploadFileToOpenAI(buffer: Buffer, fileName: string): Promise<string> {
  logger.info('⬆️ Uploading file to OpenAI', { fileName });

  const formData = new FormData();
  formData.append('file', buffer, fileName);
  formData.append('purpose', 'assistants');

  try {
    const response = await axios.post(`${OPENAI_API_BASE}/files`, formData, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
    });

    const fileId = response.data.id;
    logger.info('✅ File uploaded to OpenAI', { fileName, fileId });

    await waitForFileProcessed(fileId);
    return fileId;
  } catch (error: any) {
    logger.error('❌ Failed to upload file to OpenAI', { fileName, error: error.message });
    throw error;
  }
}

export async function waitForFileProcessed(fileId: string, timeoutMs = 10000) {
  logger.info('⏳ Waiting for file to be processed', { fileId });

  const interval = 1000;
  const maxAttempts = timeoutMs / interval;
  let attempts = 0;

  while (attempts++ < maxAttempts) {
    const response = await axios.get(`${OPENAI_API_BASE}/files/${fileId}`, {
      headers: jsonHeaders,
    });

    const status = response.data.status;
    logger.debug('📄 File processing status', { fileId, status });

    if (status === 'processed') {
      logger.info('✅ File processed successfully', { fileId });
      return;
    }

    if (status === 'error') {
      throw new Error(`❌ File ${fileId} failed to process`);
    }

    await wait(interval);
  }

  throw new Error(`❌ Timed out waiting for file ${fileId} to be processed`);
}

export async function attachFileToVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
  logger.info('📦 Attaching file to vector store', { fileId, vectorStoreId });

  try {
    await axios.post(
      `${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files`,
      { file_id: fileId },
      { headers: jsonHeaders }
    );

    logger.info('📎 File attached to vector store', { fileId, vectorStoreId });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error('❌ OpenAI Vector Store API error', {
        fileId,
        vectorStoreId,
        details: error.response?.data,
      });
    }
    throw error;
  }
}

export async function deleteFileFromVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
  logger.info('🗑️ Deleting file from vector store', { fileId, vectorStoreId });

  try {
    await axios.delete(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files/${fileId}`, {
      headers: jsonHeaders,
    });
    logger.info('✅ File deleted from vector store', { fileId, vectorStoreId });
  } catch (error: any) {
    logger.warn('⚠️ Failed to delete file from vector store', {
      fileId,
      vectorStoreId,
      details: error.response?.data || error.message,
    });
  }
}

export async function deleteFileFromOpenAI(fileId: string): Promise<void> {
  logger.info('🗑️ Deleting file from OpenAI', { fileId });

  try {
    await axios.delete(`${OPENAI_API_BASE}/files/${fileId}`, {
      headers: jsonHeaders,
    });
    logger.info('✅ File deleted from OpenAI', { fileId });
  } catch (error: any) {
    logger.warn('⚠️ Failed to delete file from OpenAI', {
      fileId,
      details: error.response?.data || error.message,
    });
  }
}
