import { OpenAI } from 'openai';
import { departmentConfig } from '@/config/training';
import { logger } from '@/utils/logger';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  logger.info('📥 Received POST /api/chat/stream');

  let body;
  try {
    body = await req.json();
  } catch (err) {
    logger.error('❌ Failed to parse JSON body', err);
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { message, department } = body;
  logger.info(`🔍 Incoming department: ${department}`);
  logger.info(`✉️ Incoming message: ${message}`);

  const config = departmentConfig[department as keyof typeof departmentConfig];
  if (!config?.assistantId) {
    logger.error(`❌ No assistantId found for department: ${department}`);
    return new Response(`❌ Invalid or missing assistantId for department: ${department}`, { status: 400 });
  }

  try {
    const thread = await openai.beta.threads.create();
    logger.info(`📎 Created thread`, { threadId: thread.id });

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Department: ${department}\n\n${message}`,
    });
    logger.info('📨 Added user message to thread');

    const stream = await openai.beta.threads.runs.stream(thread.id, {
      assistant_id: config.assistantId,
    });
    logger.info('🧠 Assistant run stream started...');

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            if (part.event === 'thread.message.delta') {
              const contentBlocks = (part as any).data?.delta?.content;
              if (Array.isArray(contentBlocks)) {
                for (const block of contentBlocks) {
                  const value = block?.text?.value;
                  if (typeof value === 'string') {
                    logger.debug('📤 Streaming token', { token: value });
                    controller.enqueue(encoder.encode(value));
                    await Promise.resolve(); // flush to client
                  }
                }
              }
            }
          }
        } catch (err) {
          logger.error('⚠️ Streaming error', err);
          controller.enqueue(encoder.encode('\n⚠️ Error while streaming response.\n'));
        } finally {
          logger.info('✅ Stream completed');
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    logger.error('❌ Fatal error', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
