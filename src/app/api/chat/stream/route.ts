import { OpenAI } from 'openai';
import { departmentConfig } from '@/config/training';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('📥 Received POST /api/chat/stream');

  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error('❌ Failed to parse JSON body:', err);
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { message, department } = body;
  console.log(`🔍 Incoming department: ${department}`);
  console.log(`✉️ Incoming message: ${message}`);

  const config = departmentConfig[department as keyof typeof departmentConfig];
  if (!config?.assistantId) {
    console.error(`❌ No assistantId found for department: ${department}`);
    return new Response(`❌ Invalid or missing assistantId for department: ${department}`, { status: 400 });
  }

  try {
    const thread = await openai.beta.threads.create();
    console.log(`📎 Created thread: ${thread.id}`);

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Department: ${department}\n\n${message}`,
    });
    console.log('📨 Added user message to thread');

    const stream = await openai.beta.threads.runs.stream(thread.id, {
      assistant_id: config.assistantId,
    });
    console.log('🧠 Assistant run stream started...');

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
                    console.log('📤 Streaming token:', value);
                    controller.enqueue(encoder.encode(value));
                    await Promise.resolve(); // flush to client
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('⚠️ Streaming error:', err);
          controller.enqueue(encoder.encode('\n⚠️ Error while streaming response.\n'));
        } finally {
          console.log('✅ Stream completed.');
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
    console.error('❌ Fatal error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
