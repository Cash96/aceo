import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/app/lib/mongobd';
import SiteVisit from '@/app/models/SiteVisit';
import { OpenAI } from 'openai';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Domains to skip entirely
const blacklisted = [
  'google.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'tiktok.com',
  'amazon.com',
  'paypal.com',
  'bankofamerica.com',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      user = 'user1',
      url,
      rootDomain,
      accessedAt = new Date(),
      timeOnSite,
      rawTitle,
      pageContent,
    } = body;

    if (!url) return bad('Missing url');
    if (!rootDomain) return bad('Missing rootDomain');
    if (timeOnSite === undefined || timeOnSite === null) return bad('Missing timeOnSite');
    if (!rawTitle) return bad('Missing rawTitle');

    if (blacklisted.some(domain => rootDomain.includes(domain))) {
      logger.info('🚫 Skipping blacklisted site', { rootDomain });
      return NextResponse.json({ message: 'Site ignored (blacklisted)' });
    }

    await connectMongo();

    // Check for existing visit today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let visit = await SiteVisit.findOne({
      user,
      rootDomain,
      accessedAt: { $gte: todayStart }
    });

    if (visit) {
      logger.info(`🔄 Updating existing visit`, { rootDomain });
      visit.timeOnSite += timeOnSite;
      visit.accessedAt = accessedAt;
    } else {
      logger.info(`🆕 Creating new visit`, { rootDomain });

      // Check if we already have enrichment cached
      const previousEnriched = await SiteVisit.findOne({
        rootDomain,
        genTitle: { $ne: '' },
        genSubject: { $ne: '' }
      }).sort({ accessedAt: -1 });

      let enrichment;

      if (previousEnriched) {
        logger.info(`♻️ Reusing enrichment`, { rootDomain });
        enrichment = {
          title: previousEnriched.genTitle,
          description: previousEnriched.genDescription,
          subject: previousEnriched.genSubject,
          confidence: previousEnriched.confidence || ''
        };
      } else {
        logger.info(`🧠 Running AI enrichment`, { rootDomain });
        enrichment = await enrichWithAI(pageContent || '');
      }

      visit = new SiteVisit({
        user,
        url,
        rootDomain,
        accessedAt,
        timeOnSite,
        rawTitle,
        genTitle: enrichment.title,
        genDescription: enrichment.description,
        genSubject: enrichment.subject,
        confidence: enrichment.confidence || ''
      });
    }

    await visit.save();

    logger.info('✅ Site visit recorded', { rootDomain, timeOnSite });

    return NextResponse.json({ message: '✅ Site visit recorded', visit });
  } catch (err: any) {
    logger.error('❌ Failed to record site visit', err);
    return NextResponse.json(
      { error: 'Failed to record site visit' },
      { status: 500 }
    );
  }
}

// Helper to return bad request
function bad(msg: string) {
  logger.warn(`⚠️ Bad request: ${msg}`);
  return NextResponse.json({ error: msg }, { status: 400 });
}

// AI enrichment logic
async function enrichWithAI(pageContent: string) {
  if (!pageContent.trim()) {
    return {
      title: '',
      description: '',
      subject: '',
      confidence: ''
    };
  }

  const prompt = `
You are an educational content classifier tasked with analyzing a web page and categorizing it based on its learning value.

Here is the visible text content of the web page:
"${pageContent.slice(0, 4000)}"

Your job is to extract meaningful educational metadata.  
Respond in strict JSON format with the following fields:
{
  "title": "<Concise, meaningful title for the page>",
  "description": "<A clear 2–3 sentence description of what a learner can gain from this page>",
  "subject": "<The single best matching subject from the following list: Science, Technology, Engineering, Art, Math, Biology, Chemistry, Physics, Environmental Science, Astronomy, Health & Medicine, Psychology, Sociology, Computer Science, Software Development, AI & Machine Learning, Data Science, Cybersecurity, Cloud Computing, Electrical Engineering, Mechanical Engineering, Civil Engineering, Robotics, Aerospace Engineering, Visual Arts, Design, Music, Performing Arts, Literature, Creative Writing, Algebra, Calculus, Statistics, Logic & Reasoning, History, Business, Economics, Languages, Philosophy, Education, Law, General Knowledge>",
  "confidence": "<One of: High, Medium, Low — indicating how confident you are that this page is educational>"
}
If the content is clearly not educational, still pick the most appropriate subject and mark confidence as "Low".
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  try {
    const json = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      title: json.title || '',
      description: json.description || '',
      subject: json.subject || '',
      confidence: json.confidence || ''
    };
  } catch {
    logger.warn('⚠️ Failed to parse AI enrichment response.');
    return { title: '', description: '', subject: '', confidence: '' };
  }
}
