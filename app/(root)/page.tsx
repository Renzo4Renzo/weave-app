import { WispCard } from "@/components/cards/WispCard";
import { getWisps } from "@/lib/actions/wisp.actions";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const result = await getWisps(1, 30);
  const user = await currentUser();

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <section className="mt-9 flex flex-col gap-10">
        {result.wisps.length === 0 ? (
          <p className="no-result">No wisps found</p>
        ) : (
          <>
            {result.wisps.map((wisp) => (
              <WispCard
                key={wisp._id}
                id={wisp._id}
                currentUserId={user?.id || ""}
                parentId={wisp.parentId}
                content={wisp.text}
                author={wisp.author}
                community={wisp.community}
                createdAt={wisp.createdAt}
                comments={wisp.children}
              />
            ))}
          </>
        )}
      </section>
    </>
  );
}
