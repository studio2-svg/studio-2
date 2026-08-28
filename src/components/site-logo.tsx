import Image from "next/image";

export function SiteLogo({ tone = "black", large = false }: { tone?: "black" | "white"; large?: boolean }) {
  const white = tone === "white";
  return (
    <span className={`relative block shrink-0 overflow-hidden ${large ? "h-[3.75rem] w-[11rem]" : "h-11 w-[8.5rem]"}`}>
      <Image
        src="/studio-2-logo-black.png"
        alt="Studio 2"
        width={821}
        height={849}
        priority
        className={`absolute max-w-none ${white ? "brightness-0 invert" : ""} ${large ? "-left-[91px] -top-[139px] h-[359px] w-[347px]" : "-left-[69px] -top-[105px] h-[271px] w-[262px]"}`}
      />
    </span>
  );
}
