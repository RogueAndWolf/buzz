import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { UserAvatar } from "@/shared/ui/UserAvatar";

export type SidebarMemberAvatar = {
  avatarUrl: string | null;
  label: string;
  pubkey: string;
};

export type SidebarMemberAvatarStackData = {
  members: SidebarMemberAvatar[];
  overflowCount: number;
};

/**
 * Overlapping member-avatar cluster rendered as a second line under non-DM
 * channel rows. Pure decoration: aria-hidden, no per-avatar interaction — the
 * channel row stays the single click target. Follows the `ProjectPeopleStack`
 * recipe (overlap + z-cascade + "+N" pill), shrunk and quieted for the
 * sidebar. One playful flourish: hovering anywhere on the cluster plays every
 * animated avatar in it at once — a single hover state on the container,
 * passed down as the controlled `animated` prop.
 */
export function SidebarMemberAvatarStack({
  className,
  members,
  overflowCount,
}: {
  className?: string;
  members: SidebarMemberAvatar[];
  overflowCount: number;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  if (members.length === 0) {
    return null;
  }

  const names = members.map((member) => member.label).join(", ");

  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center -space-x-1", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={overflowCount > 0 ? `${names} +${overflowCount} more` : names}
    >
      {members.map((member, index) => (
        // First avatar sits on the top layer, cascading down rightward.
        <span
          className="relative inline-flex"
          key={member.pubkey}
          style={{ zIndex: members.length - index }}
        >
          <UserAvatar
            animated={isHovered}
            avatarUrl={member.avatarUrl}
            className="h-4 w-4 ring-1 ring-sidebar"
            displayName={member.label}
            size="xs"
          />
        </span>
      ))}
      {overflowCount > 0 ? (
        <span className="relative z-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-accent px-1 text-3xs font-medium leading-none text-sidebar-foreground/70 ring-1 ring-sidebar">
          +{overflowCount}
        </span>
      ) : null}
    </div>
  );
}
