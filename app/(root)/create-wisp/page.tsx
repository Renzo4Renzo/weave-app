import { PostWisp } from "@/components/forms/PostWisp";
import { getUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await getUser(user.id);

  if (!userInfo.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className="head-text">Create Wisp</h1>
      <PostWisp userId={userInfo._id.toString()} />
    </>
  );
}
