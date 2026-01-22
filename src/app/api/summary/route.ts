import { NextRequest, NextResponse } from "next/server";
import { eq, isNull } from "drizzle-orm";
import { summarizeArticle } from "@/ai/summarize";
import db from "@/db";
import { articles } from "@/db/schema";
import redis from "@/cache";

export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV !== "development" &&
        req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find articles that don't yet have a summary
    const rows = await db
        .select({
            id: articles.id,
            title: articles.title,
            content: articles.content
        })
        .from(articles)
        .where(isNull(articles.summary));

    if (!rows || rows.length === 0) {
        return NextResponse.json({ ok: true, updated: 0 })
    }

    let updated = 0;

    console.log('Starting AI summary job');

    for (const row of rows) {
        try {
            const summary = await summarizeArticle(row.title ?? '', row.content);

            if (summary && summary.trim().length > 0) {
                await db.update(articles)
                    .set({ summary })
                    .where(eq(articles.id, row.id));

                updated++
            }
        } catch (error) {
            // log and continue with next article
            console.error(`Failed to summarize id ${row.id}`, error);
            continue;
        }
    }

    if (updated > 0) {
        // Clear articles cache used by getArticles
        try {
            await redis.del('articles:all');
        } catch (error) {
            console.warn('Failed to clear articles cache', error);
        }
    }

    console.log(`Concluding AI summary job, updated ${updated} rows`);

    return NextResponse.json({ ok: true, updated });
}
