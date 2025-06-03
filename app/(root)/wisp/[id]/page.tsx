export const dynamic = "force-dynamic";

import { WispCard } from "@/components/cards/WispCard";
import { Comment } from "@/components/forms/Comment";
import { getUser } from "@/lib/actions/user.actions";
import { getWispById } from "@/lib/actions/wisp.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type WispPageParams = {
  params: { id: string };
};

export default async function Page(props: WispPageParams) {
  const params = await Promise.resolve(props.params);
  const wispId = params.id;

  if (!wispId) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await getUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const wisp = await getWispById(wispId);

  return (
    <section className="relative">
      <div>
        <WispCard
          key={wisp._id}
          id={wisp._id}
          currentUserId={user.id}
          parentId={wisp.parentId}
          content={wisp.text}
          author={wisp.author}
          community={wisp.community}
          createdAt={wisp.createdAt}
          comments={wisp.children}
        />
      </div>
      <div className="mt-7">
        <Comment wispId={wisp.id} currentUserImg={userInfo.image} currentUserId={userInfo._id.toString()} />
      </div>

      <div className="mt-10">
        {wisp.children.map((child: any) => (
          <WispCard
            key={child._id}
            id={child._id}
            currentUserId={user.id}
            parentId={child.parentId}
            content={child.text}
            author={child.author}
            community={child.community}
            createdAt={child.createdAt}
            comments={child.children}
            isComment
          />
        ))}
      </div>
    </section>
  );
}
