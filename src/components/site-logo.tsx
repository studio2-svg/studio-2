import Image from "next/image";

export function SiteLogo({ tone = "black", large = false }: { tone?: "black" | "gold"; large?: boolean }) {
  const gold = tone === "gold";
  return (
    <span className={`relative block shrink-0 overflow-hidden ${large ? "h-[3.75rem] w-[11rem]" : "h-11 w-[8.5rem]"}`}>
      <Image
        src={gold ? "/studio-2-logo-gold.png" : "/studio-2-logo-black.png"}
        alt="Studio 2"
        width={821}
        height={849}
        priority
        className={`absolute max-w-none ${large ? (gold ? "-left-[86px] -top-[143px] h-[354px] w-[342px]" : "-left-[91px] -top-[139px] h-[359px] w-[347px]") : (gold ? "-left-[67px] -top-[111px] h-[275px] w-[266px]" : "-left-[69px] -top-[105px] h-[271px] w-[262px]")}`}
      />
    </span>
  );
}
