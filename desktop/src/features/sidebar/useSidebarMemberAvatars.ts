import * as React from "react";

import { useUsersBatchQuery } from "@/features/profile/hooks";
import { resolveUserLabel } from "@/features/profile/lib/identity";
import type { SidebarMemberAvatarStackData } from "@/features/sidebar/ui/SidebarMemberAvatarStack";
import type { Channel } from "@/shared/api/types";
import { useFeatureEnabled } from "@/shared/features";
import { useDeferredLoad } from "@/shared/hooks/useDeferredStartup";

/** Avatars shown per channel row; the rest collapse into a "+N" pill. */
const MAX_VISIBLE_MEMBERS = 4;

/**
 * Resolves the member-avatar clusters rendered under non-DM channel rows.
 *
 * Rosters come from `Channel.memberPubkeys` — the kind:39002 p-tags already
 * batch-fetched by `get_channels` — so membership costs zero extra relay
 * queries. Only the first MAX_VISIBLE_MEMBERS pubkeys per channel enter the
 * kind-0 profile batch, keeping the fetch bounded, and `useUsersBatchQuery`'s
 * per-pubkey entry cache dedupes the heavily overlapping rosters across
 * sections. Returns undefined until the `sidebarMemberAvatars` flag is on and
 * profiles resolve; channels without a cached roster get no entry, so their
 * rows render exactly as before — never a placeholder.
 */
export function useSidebarMemberAvatars(
  channels: Channel[],
): Record<string, SidebarMemberAvatarStackData> | undefined {
  const enabled = useFeatureEnabled("sidebarMemberAvatars");
  // Decoration only — never competes with first paint.
  const ready = useDeferredLoad();
  const rosters = React.useMemo(() => {
    if (!enabled) {
      return [];
    }
    return channels
      .filter(
        (channel) =>
          channel.channelType !== "dm" && channel.memberPubkeys.length > 0,
      )
      .map((channel) => ({
        channel,
        // Array window (first N members), not identity truncation.
        visible: channel.memberPubkeys.slice(0, MAX_VISIBLE_MEMBERS),
      }));
  }, [channels, enabled]);
  const pubkeys = React.useMemo(
    () => rosters.flatMap((roster) => roster.visible),
    [rosters],
  );
  const profilesQuery = useUsersBatchQuery(pubkeys, {
    enabled: enabled && ready,
  });
  const profiles = profilesQuery.data?.profiles;

  return React.useMemo(() => {
    if (!profiles || rosters.length === 0) {
      return undefined;
    }
    return Object.fromEntries(
      rosters.map(
        ({ channel, visible }): [string, SidebarMemberAvatarStackData] => {
          const memberTotal = Math.max(
            channel.memberCount,
            channel.memberPubkeys.length,
          );
          return [
            channel.id,
            {
              members: visible.map((pubkey) => ({
                avatarUrl: profiles[pubkey.toLowerCase()]?.avatarUrl ?? null,
                label: resolveUserLabel({ profiles, pubkey }),
                pubkey,
              })),
              overflowCount: Math.max(0, memberTotal - visible.length),
            },
          ];
        },
      ),
    );
  }, [profiles, rosters]);
}
