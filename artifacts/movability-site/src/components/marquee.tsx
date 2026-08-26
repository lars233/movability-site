import { cn } from "@/lib/utils";
import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({
  children,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  const items = React.Children.toArray(children);
  const duration = speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";

  return (
    <div className={cn("overflow-hidden w-full", className)}>
      <div
        className={cn("flex w-max", pauseOnHover && "hover:[animation-play-state:paused]")}
        style={{
          animation: `marquee-scroll ${duration} linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {items}
        {items}
      </div>
    </div>
  );
}
