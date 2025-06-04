"use client";

import { useUser } from "@clerk/nextjs";
import { sidebarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

function Bottombar() {
  const pathname = usePathname();
  const { isLoaded, user } = useUser();
  const userId = user?.id;

  if (!isLoaded || !userId) return null;

  return (
    <section className="bottombar">
      <div className="bottombar_container">
        {sidebarLinks.map((link) => {
          const isActive = (pathname.includes(link.route) && link.route.length > 1) || pathname === link.route;
          const href = link.route === "/profile" ? `/profile/${userId}` : link.route;

          return (
            <Link href={href} key={link.label} className={`bottombar_link ${isActive && "bg-primary-500"}`}>
              <Image src={link.imgURL} alt={link.label} width={24} height={24} />
              <p className="text-subtle-medium text-light-1 max-sm:hidden"> {link.label.split(/\s+./)[0]}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default Bottombar;
