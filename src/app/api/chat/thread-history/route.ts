// src/app/api/chat/thread-history/route.ts
import { OpenAI } from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('📥 Received POST /api/chat/thread-history');

  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error('❌ Failed to parse JSON body:', err);
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { threadId } = body;
  if (!threadId) {
    console.error('❌ Missing threadId');
    return new Response(JSON.stringify({ error: 'Missing threadId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const messagesRes = await openai.beta.threads.messages.list(threadId);

    // sort by created_at ascending
    const sortedMessages = messagesRes.data
      .sort((a: any, b: any) => a.created_at - b.created_at)
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content?.[0]?.text?.value || '',
        timestamp: msg.created_at,
      }));

    console.log(`✅ Retrieved and sorted ${sortedMessages.length} messages for thread ${threadId}`);

    return new Response(JSON.stringify({ messages: sortedMessages }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Failed to fetch thread messages', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch thread' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
