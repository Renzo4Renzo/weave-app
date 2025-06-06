import { getUserWisps } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { WispCard } from "../cards/WispCard";
import { fetchCommunityWisps } from "@/lib/actions/community.actions";

interface WispsTabProps {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

export default async function WispsTab({ currentUserId, accountId, accountType }: WispsTabProps) {
  let result: any;

  if (accountType === "Community") {
    result = await fetchCommunityWisps(accountId);
  } else {
    result = await getUserWisps(accountId);
  }

  if (!result) {
    redirect("/");
  }

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.wisps.map((wisp: any) => (
        <WispCard
          key={wisp._id}
          id={wisp._id}
          currentUserId={currentUserId}
          parentId={wisp.parentId}
          content={wisp.text}
          author={
            accountType === "User"
              ? { name: result.name, image: result.image, id: result.id }
              : { name: wisp.author.name, image: wisp.author.image, id: wisp.author.id }
          }
          community={wisp.community} //TODO
          createdAt={wisp.createdAt}
          comments={wisp.children}
        />
      ))}
    </section>
  );
}
