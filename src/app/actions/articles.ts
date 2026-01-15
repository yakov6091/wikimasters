"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import db from "@/db";
import { authorizeUserToEditArticle } from "@/db/authz";
import { articles } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { ensureUserExists } from "@/db/ensureUserExists";

export type CreateArticleInput = {
  title: string;
  content: string;
  authorId: string;
  imageUrl?: string;
};

export type UpdateArticleInput = {
  title?: string;
  content?: string;
  imageUrl?: string;
};

// Create Article
export async function createArticle(data: CreateArticleInput) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await ensureUserExists(user);

  console.log("✨ createArticle called:", data);

  const response = await db
    .insert(articles)
    .values({
      title: data.title,
      content: data.content,
      slug: `${Date.now()}`,
      published: true,
      authorId: user.id,
    })
    .returning({ id: articles.id });

  const articleId = response[0]?.id;
  return { success: true, message: 'Article create logged', id: articleId };
}

// Update Article
export async function updateArticle(id: string, data: UpdateArticleInput) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!(await authorizeUserToEditArticle(user.id, Number(id)))) {
    throw new Error("Forbidden");
  }

  const authorId = user.id;
  console.log("📝 updateArticle called:", authorId, data);

  await db
    .update(articles)
    .set({
      title: data.title,
      content: data.content,
    })
    .where(eq(articles.id, Number(id)));

  return { success: true, message: `Article ${id} update logged` };
}

// Delete Article
export async function deleteArticle(id: string) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!(await authorizeUserToEditArticle(user.id, Number(id)))) {
    throw new Error("Forbiden");
  }

  const authorId = user.id;
  console.log("🗑️ deleteArticle called:", authorId);

  await db.delete(articles).where(eq(articles.id, Number(id)));

  return { success: true, message: `Article ${id} delete logged` };
}

// Form-friendly server action: accepts FormData from a client form and calls deleteArticle
export async function deleteArticleForm(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (!id) {
    throw new Error("Missing article id");
  }

  await deleteArticle(String(id));
  // After deleting, redirect the user back to the homepage.
  redirect("/");
}
