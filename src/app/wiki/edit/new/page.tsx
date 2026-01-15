import WikiEditor from "@/components/wiki-editor";
import { stackServerApp } from "@/stack/server";
import { StackServerApp } from "@stackframe/stack";

export default async function NewArticlePage() {
  await stackServerApp.getUser({ or: 'redirect' });
  return <WikiEditor isEditing={false} />;
}
