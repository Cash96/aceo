// openai.ts
import axios from 'axios';
import FormData from 'form-data';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_API_BASE = 'https://api.openai.com/v1';

const jsonHeaders = {
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
};

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function uploadFileToOpenAI(buffer: Buffer, fileName: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', buffer, fileName); // Directly using buffer
  formData.append('purpose', 'assistants');

  const response = await axios.post(`${OPENAI_API_BASE}/files`, formData, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
    maxBodyLength: Infinity,
  });

  const fileId = response.data.id;
  console.log(`✅ Uploaded ${fileName} to OpenAI as ${fileId}`);

  await waitForFileProcessed(fileId);
  return fileId;
}

export async function waitForFileProcessed(fileId: string, timeoutMs = 10000) {
  const interval = 1000;
  const maxAttempts = timeoutMs / interval;
  let attempts = 0;

  while (attempts++ < maxAttempts) {
    const response = await axios.get(`${OPENAI_API_BASE}/files/${fileId}`, {
      headers: jsonHeaders,
    });

    const status = response.data.status;
    console.log(`⏳ File status: ${status}`);

    if (status === 'processed') {
      console.log('✅ File is processed and ready.');
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
  console.log(`📦 Attaching file ${fileId} to vector store ${vectorStoreId}`);

  try {
    const response = await axios.post(
      `${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files`,
      { file_id: fileId },
      { headers: jsonHeaders }
    );

    console.log(`📎 Attached file ${fileId} to vector store ${vectorStoreId}`);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('❌ OpenAI Vector Store Error Details:', error.response?.data);
    }
    throw error;
  }
}

export async function deleteFileFromVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
  try {
    await axios.delete(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files/${fileId}`, {
      headers: jsonHeaders,
    });
    console.log(`🗑️ Deleted file ${fileId} from vector store ${vectorStoreId}`);
  } catch (error: any) {
    console.warn(`⚠️ Failed to delete file from vector store: ${fileId}`, error.response?.data || error.message);
  }
}

export async function deleteFileFromOpenAI(fileId: string): Promise<void> {
  try {
    await axios.delete(`${OPENAI_API_BASE}/files/${fileId}`, {
      headers: jsonHeaders,
    });
    console.log(`🗑️ Deleted file ${fileId} from OpenAI`);
  } catch (error: any) {
    console.warn(`⚠️ Failed to delete OpenAI file: ${fileId}`, error.response?.data || error.message);
  }
}
