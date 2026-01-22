import { eq } from "drizzle-orm";
import db from "@/db";
import { articles, usersSync } from "@/db/schema";
import resend from "@/email";
import CelebrationTemplate from "./templates/celebration-template";


const BASE_URL = process.env.VERCEL_URL ?
    `http://${process.env.VERCEL_URL}` : `http://localhost:3000`;

export default async function sendCelebrationEmail(
    articleId: number,
    pageviews: number,
) {
    const response = await db
        .select({
            email: usersSync.email,
            id: usersSync.id,
            title: articles.title,
            name: usersSync.name
        })
        .from(articles)
        .leftJoin(usersSync, eq(articles.authorId, usersSync.id))
        .where(eq(articles.id, articleId));

    const { email, id, title, name } = response[0];
    if (!email) {
        console.log(`skipping celebration for ${articleId} on pageviews
         ${pageviews}, could not find email in database`);
        return;
    }

    // If have costume domain setup
    // const emailResend = await resend.emails.send({
    //     from: 'Wikimasters <noreply@email.brtslavski.com>',
    //     to: email,
    //     subject: `Your article on Wikimasters got ${pageviews} views`,
    //     html: `<h1>Congrats!</h1> <p>You're an amazing author</p>`
    // });

    const emailResend = await resend.emails.send({
        from: "Wikimasters <onboarding@resend.dev>",
        to: 'yakov6091@gmail.com', // Your email that you sighned up with
        subject: `Your article on Wikimasters got ${pageviews} views`,
        react: (
            <CelebrationTemplate
                articleTitle={title}
                articleUrl={`${BASE_URL}/wiki/${articleId}`}
                name={name ?? "Friend"}
                pageviews={pageviews}
            />
        ),
    });

    if (!emailResend.error) {
        console.log(`Sent ${id} a celebration email for getting
            ${pageviews} on article ${articleId}`);
    } else {
        console.log(`Error sending ${id} a celebration email for getting
            ${pageviews} on article ${articleId}`);
    }
}
