import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
// import fs from 'fs';
// import path from 'path';
// import simpleGit from 'simple-git';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// CHANGE THIS to your custom trained assistant ID
const CUSTOM_ASSISTANT_ID = 'asst_your_custom_id';


import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

async function cloneOrPull(repoUrl: string, targetPath: string) {
  if (fs.existsSync(targetPath)) {
    const gitDir = path.join(targetPath, '.git');
    if (fs.existsSync(gitDir)) {
      const git: SimpleGit = simpleGit(targetPath);

      // get current remote URL
      const remotes = await git.getRemotes(true);
      const origin = remotes.find(r => r.name === 'origin');
      const currentUrl = origin?.refs.fetch;

      if (currentUrl === repoUrl) {
        console.log(`✅ Pulling latest from ${repoUrl}`);
        await git.pull();
        return;
      } else {
        console.warn(`⚠️ Remote URL mismatch: expected ${repoUrl} but got ${currentUrl}`);
        console.warn(`🧹 Removing ${targetPath} and re-cloning...`);
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
    } else {
      console.warn(`⚠️ ${targetPath} exists but no .git folder. Removing...`);
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  }

  console.log(`📥 Cloning ${repoUrl} into ${targetPath}`);
  await simpleGit().clone(repoUrl, targetPath);
}



function getLastCommits(repoPath: string, n = 3) {
  return execSync(`git -C ${repoPath} log -n ${n} --oneline`).toString();
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error('❌ Failed to parse JSON body:', err);
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { projectRepo, siteRepo } = body;

  const projectPath = '/tmp/project';
  const sitePath = '/tmp/site';

  await cloneOrPull(projectRepo, projectPath);
  await cloneOrPull(siteRepo, sitePath);

  const projectCommits = getLastCommits(projectPath);
  const siteCommits = getLastCommits(sitePath);

  let logs = '';
  const logFile = path.join(sitePath, 'logs', 'last_24_hours.log');
  if (fs.existsSync(logFile)) {
    logs = fs.readFileSync(logFile, 'utf-8');
  }

  const content = `
📄 Flash Training Context:
---
🗂️ Project Repo Commits:
${projectCommits}

🗂️ Site Repo Commits:
${siteCommits}

📝 Logs (last 24 hours):
${logs || 'No logs found.'}

Task: Learn this current state and be ready to generate a gameplan or apply improvements based on this context. Acknowledge when ready.
`;

  try {
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content,
    });

    const stream = await openai.beta.threads.runs.stream(thread.id, {
      assistant_id: CUSTOM_ASSISTANT_ID,
    });

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
                    controller.enqueue(encoder.encode(value));
                    await Promise.resolve();
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('⚠️ Streaming error:', err);
          controller.enqueue(encoder.encode('\n⚠️ Error while streaming response.\n'));
        } finally {
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
    console.error('❌ Fatal error in flash-train stream:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
