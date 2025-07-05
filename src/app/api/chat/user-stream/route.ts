import { OpenAI } from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('📥 Received POST /api/chat/user-stream');

  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error('❌ Failed to parse JSON body:', err);
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { message, chatAssistantId, threadId } = body;
  console.log(`✉️ Incoming message: ${message}`);
  console.log(`🧠 Assistant ID: ${chatAssistantId}`);
  console.log(`🧵 Provided threadId: ${threadId || 'none'}`);

  if (!chatAssistantId) {
    return new Response('Missing chatAssistantId', { status: 400 });
  }

  try {
    let threadIdToUse = threadId;

    if (!threadIdToUse) {
      const thread = await openai.beta.threads.create();
      threadIdToUse = thread.id;
      console.log(`📎 Created new thread: ${threadIdToUse}`);
    } else {
      console.log(`🔄 Resuming thread: ${threadIdToUse}`);
    }

    await openai.beta.threads.messages.create(threadIdToUse, {
      role: 'user',
      content: message,
    });
    console.log('📨 Added user message to thread');

    const stream = await openai.beta.threads.runs.stream(threadIdToUse, {
      assistant_id: chatAssistantId,
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
        'x-thread-id': threadIdToUse,
      },
    });
  } catch (err) {
    console.error('❌ Fatal error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
