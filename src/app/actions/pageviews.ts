"use server";

import redis from "@/cache";
import sendCelebrationEmail from "@/email/celebration-email";

const milestones = [10, 20, 25, 50, 100, 1000];

const keyFor = (id: number) => `pageviews:article${id}`;

export async function incrementPageview(articleId: number) {
  const articleKey = keyFor(articleId);
  const newValue = await redis.incr(articleKey);

  if (milestones.includes(newValue)) {
    // don't await so we don't block on sending the email, just send it
    sendCelebrationEmail(articleId, Number(newValue));
  }

  return Number(newValue);
}
