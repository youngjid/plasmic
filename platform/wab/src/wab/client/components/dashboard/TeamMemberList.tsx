import { HTMLElementRefOf } from "@plasmicapp/react-web";
import { sortBy } from "lodash";
import * as React from "react";
import { Modal } from "src/wab/client/components/widgets/Modal";
import {
  ApiFeatureTier,
  ApiPermission,
  ApiTeam,
  TeamMember,
} from "../../../shared/ApiSchema";
import { fullName } from "../../../shared/ApiSchemaUtil";
import { accessLevelRank, GrantableAccessLevel } from "../../../shared/EntUtil";
import { useAppCtx } from "../../contexts/AppContexts";
import {
  DefaultTeamMemberListProps,
  PlasmicTeamMemberList,
} from "../../plasmic/plasmic_kit_dashboard/PlasmicTeamMemberList";
import { Matcher } from "../view-common";
import ShareDialogContent from "../widgets/plasmic/ShareDialogContent";
import Select from "../widgets/Select";
import TeamMemberListItem from "./TeamMemberListItem";

interface TeamMemberListProps extends DefaultTeamMemberListProps {
  team?: ApiTeam;
  members: TeamMember[];
  perms: ApiPermission[];
  tier: ApiFeatureTier;
  onChangeRole: (email: string, role?: GrantableAccessLevel) => Promise<void>;
  onRemoveUser: (email: string) => Promise<void>;
  onReload: () => Promise<void>;
  disabled?: boolean;
}

function TeamMemberList_(
  props: TeamMemberListProps,
  ref: HTMLElementRefOf<"div">
) {
  const {
    members,
    perms,
    onChangeRole,
    onRemoveUser,
    onReload,
    disabled,
    team,
    tier,
    ...rest
  } = props;
  const appCtx = useAppCtx();

  // Shared Modal
  const [sharedModal, setSharedModal] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const matcher = new Matcher(query);

  // Team member filters + search
  const [filterSelect, setFilterSelect] = React.useState<string | null>("all");
  let displayedMembers = members
    .filter(
      (m) =>
        (m.type === "user" && matcher.matches(fullName(m))) ||
        matcher.matches(m.email)
    )
    .filter(
      (m) =>
        filterSelect === "all" ||
        (filterSelect === "owner" &&
          perms.find(
            (p) => p.user?.email === m.email && p.accessLevel === "owner"
          )) ||
        (filterSelect === "editor" &&
          perms.find(
            (p) => p.user?.email === m.email && p.accessLevel === "editor"
          )) ||
        (filterSelect === "designer" &&
          perms.find(
            (p) => p.user?.email === m.email && p.accessLevel === "designer"
          )) ||
        (filterSelect === "content" &&
          perms.find(
            (p) => p.user?.email === m.email && p.accessLevel === "content"
          )) ||
        (filterSelect === "viewer" &&
          perms.find(
            (p) =>
              p.user?.email === m.email &&
              ["viewer", "commenter"].includes(p.accessLevel)
          )) ||
        (filterSelect === "none" &&
          !perms.find((p) => p.user?.email === m.email))
    );
  // The following lines perform 2 stable sorts so the members are sorted by
  // access level rank -> name (or email, if it's a member with no user).
  displayedMembers = sortBy(displayedMembers, (m) =>
    m.type === "user" ? fullName(m) : m.email
  );
  displayedMembers = sortBy(
    displayedMembers,
    (m) =>
      -accessLevelRank(
        perms.find((p) => p.user?.email === m.email)?.accessLevel ?? "blocked"
      )
  );
  return (
    <>
      <PlasmicTeamMemberList
        {...rest}
        root={{ ref }}
        newButton={{
          onClick: async () => {
            setSharedModal(true);
          },
        }}
        memberSearch={{
          value: query,
          onChange: (e) => setQuery(e.target.value),
          autoFocus: true,
        }}
        filterSelect={{
          value: filterSelect,
          onChange: setFilterSelect,
          children: [
            <Select.Option value="all">All Roles</Select.Option>,
            <Select.Option value="owner">Owners</Select.Option>,
            <Select.Option value="editor">Developers</Select.Option>,
            ...(appCtx.appConfig.contentOnly ||
            perms.some(
              (perm) =>
                perm.accessLevel === "designer" ||
                perm.accessLevel === "content"
            )
              ? [
                  <Select.Option value="designer">Designers</Select.Option>,
                  <Select.Option value="content">
                    Content Creators
                  </Select.Option>,
                ]
              : []),
            <Select.Option value="viewer">Viewers</Select.Option>,
            <Select.Option value="none">None</Select.Option>,
          ],
        }}
      >
        {displayedMembers.map((user) => (
          <TeamMemberListItem
            key={user.email}
            user={user}
            matcher={matcher}
            perm={perms.find(
              (p) => p.user?.email === user.email || p.email === user.email
            )}
            tier={tier}
            changeRole={onChangeRole}
            removeUser={onRemoveUser}
            disabled={disabled}
          />
        ))}
      </PlasmicTeamMemberList>
      {sharedModal && team && (
        <Modal
          visible={true}
          onCancel={() => setSharedModal(false)}
          modalRender={() => (
            <ShareDialogContent
              className="ant-modal-content"
              resource={{ type: "team", resource: team }}
              perms={perms}
              closeDialog={() => setSharedModal(false)}
              reloadPerms={onReload}
              updateResourceCallback={onReload}
            />
          )}
        />
      )}
    </>
  );
}

const TeamMemberList = React.forwardRef(TeamMemberList_);
export default TeamMemberList;
