"use server";

import redis from "@/cache";

const keyFor = (id: number) => `pageviews:article${id}`;

export async function incrementPageview(articleId: number) {
    const articleKey = keyFor(articleId);
    const newValue = await redis.incr(articleKey);
    return Number(newValue);
}
