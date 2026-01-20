import { eq } from "drizzle-orm";
import redis from "@/cache";
import db from "@/db/index";
import { articles, usersSync } from "@/db/schema";

export type ArticleList = {
  id: number;
  title: string;
  createdAt: string;
  content: string;
  author: string | null;
  imageUrl?: string | null;
};

export async function getArticles(): Promise<ArticleList[]> {
  const cached = await redis.get<ArticleList[]>('articles:all');
  if (cached) {
    console.log('Get articles cache hit');
    return cached;
  }

  const response = await db
    .select({
      title: articles.title,
      id: articles.id,
      createdAt: articles.createdAt,
      content: articles.content,
      author: usersSync.name,
    })
    .from(articles)
    .leftJoin(usersSync, eq(articles.authorId, usersSync.id)); // eq = equal

  console.log('Get articles cache miss');
  try {
    redis.set('articles:all', JSON.stringify(response), {
      ex: 60
    });
  } catch (error) {
    console.warn("Failed to set articles cache", error);
  }
  return response as unknown as ArticleList[];
}

export async function getArticleById(id: number) {
  const response = await db
    .select({
      title: articles.title,
      id: articles.id,
      createdAt: articles.createdAt,
      content: articles.content,
      author: usersSync.name,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .leftJoin(usersSync, eq(articles.authorId, usersSync.id));
  return response[0] ? response[0] : null;
}
