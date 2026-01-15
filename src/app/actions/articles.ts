"use server";

import { eq } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";
import { authorizeUserToEditArticle } from "@/db/authz";
import db from "@/db"
import { articles } from "@/db/schema";
import { redirect } from "next/navigation";

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

export async function createArticle(data: CreateArticleInput) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  console.log("✨ createArticle called:", data);

  await db.insert(articles).values({
    title: data.title,
    content: data.content,
    slug: '' + Date.now(),
    published: true,
    authorId: user.id
  })
  return { success: true, message: "Article create logged (stub)" };
}

export async function updateArticle(id: string, data: UpdateArticleInput) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!(await authorizeUserToEditArticle(user.id, Number(id)))) {
    throw new Error('Forbidden');
  }

  const authorId = user.id;
  console.log("📝 updateArticle called:", authorId, data);

  await db.update(articles).set({
    title: data.title,
    content: data.content
  }).where(eq(articles.id, Number(id)));

  return { success: true, message: `Article ${id} update logged (stub)` };
}

export async function deleteArticle(id: string) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!(await authorizeUserToEditArticle(user.id, Number(id)))) {
    throw new Error('Forbiden');
  }

  const authorId = user.id;
  console.log("🗑️ deleteArticle called:", authorId);

  await db.delete(articles).where(eq(articles.id, Number(id)))

  return { success: true, message: `Article ${id} delete logged (stub)` };
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
