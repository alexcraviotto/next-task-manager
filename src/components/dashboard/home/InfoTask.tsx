"use client";

import { usePathname, useRouter } from "next/navigation";

export const InfoTask = ({
  name,
  value,
  slug,
}: {
  name: string;
  value: number;
  slug: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  console.log("🚀 ~ InfoTask ~ pathname:", pathname);
  return (
    <div
      className="shadow-md backdrop-blur-md p-2 md:p-5 flex flex-col justify-center items-center rounded-md cursor-pointer hover:scale-105 transition-all duration-200"
      onClick={() => router.push(`${pathname}/${slug}`)}
    >
      <span className="text-4xl text-[#272727] text-opacity-[0.86]">
        {value}
      </span>
      <p className="text-[#272727] text-opacity-[0.86]">{name}</p>
    </div>
  );
};
