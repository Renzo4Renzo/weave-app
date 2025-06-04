import { ProfileHeader } from "@/components/shared/ProfileHeader";
import { getUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import { profileTabs } from "@/constants";
import Image from "next/image";
import WispsTab from "@/components/shared/WispsTab";

interface ProfileParams {
  params: { id: string };
}

export default async function Page(props: ProfileParams) {
  const params = await Promise.resolve(props.params);

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await getUser(params.id);

  if (!userInfo.onboarded) redirect("/onboarding");

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
      />

      <div className="mt-9">
        <Tabs defaultValue="wisps" className="w-full">
          <TabsList className="tab">
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="tab">
                <Image src={tab.icon} alt={tab.label} width={24} height={24} className="object-contain" />
                <p className="max-sm:hidden">{tab.label}</p>

                {tab.label === "Wisps" && (
                  <p className="ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2">
                    {userInfo?.wisps?.length}
                  </p>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {profileTabs.map((tab) => (
            <TabsContent key={`content-${tab.label}`} value={tab.value} className="w-full text-light-1">
              <WispsTab currentUserId={user.id} accountId={userInfo.id} accountType="User" />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
