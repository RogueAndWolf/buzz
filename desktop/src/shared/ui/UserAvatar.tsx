import * as React from "react";

import { parseAnimatedAvatarUrl } from "@/shared/lib/animatedAvatar";
import { cn } from "@/shared/lib/cn";
import { getInitials } from "@/shared/lib/initials";
import { rewriteRelayUrl } from "@/shared/lib/mediaUrl";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type UserAvatarSize = "xs" | "sm" | "md";

const sizeClasses: Record<UserAvatarSize, string> = {
  xs: "h-5 w-5 text-3xs",
  sm: "h-6 w-6 text-2xs",
  md: "h-9 w-9 text-xs",
};

type UserAvatarProps = {
  avatarUrl: string | null;
  displayName: string;
  size?: UserAvatarSize;
  accent?: boolean;
  className?: string;
  fallbackDelayMs?: number;
  testId?: string;
  /**
   * Controlled animation state. Leave undefined for the default behavior
   * (an animated avatar plays while itself hovered). Pass a boolean to drive
   * playback from the parent instead — e.g. a group-hover container that
   * plays every avatar at once — which also disables the built-in per-avatar
   * hover listeners. Ignored for non-animated avatar URLs.
   */
  animated?: boolean;
};

export function UserAvatar({
  avatarUrl,
  displayName,
  size = "md",
  accent = false,
  className,
  fallbackDelayMs = 200,
  testId,
  animated,
}: UserAvatarProps) {
  const initials = getInitials(displayName);
  // Animated avatars show their static poster frame until hovered, then play
  // the animation.
  const animatedAvatar = parseAnimatedAvatarUrl(avatarUrl);
  const [isHovered, setIsHovered] = React.useState(false);
  const selfHover = animatedAvatar !== null && animated === undefined;
  const isPlaying = animated ?? isHovered;
  const src = animatedAvatar
    ? rewriteRelayUrl(
        isPlaying ? animatedAvatar.animationUrl : animatedAvatar.posterUrl,
      )
    : avatarUrl
      ? rewriteRelayUrl(avatarUrl)
      : null;

  return (
    <Avatar
      // Animated avatars carry their own backdrop disc and transparent
      // surroundings — any container fill would flatten the pop-out.
      className={cn(
        sizeClasses[size],
        !animatedAvatar && "shadow-xs",
        className,
      )}
      onMouseEnter={selfHover ? () => setIsHovered(true) : undefined}
      onMouseLeave={selfHover ? () => setIsHovered(false) : undefined}
    >
      {src ? (
        <AvatarImage
          alt={`${displayName} avatar`}
          className={cn("object-cover", !animatedAvatar && "bg-secondary")}
          data-testid={testId ? `${testId}-image` : undefined}
          referrerPolicy="no-referrer"
          src={src}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "font-semibold",
          accent
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
        data-testid={testId ? `${testId}-fallback` : undefined}
        delayMs={fallbackDelayMs}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
