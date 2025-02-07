// This is a skeleton starter React component generated by Plasmic.
// This file is owned by you, feel free to edit as you see fit.
import { Menu, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { DEVFLAGS } from "../../../devflags";
import { isDedicatedArena } from "../../../shared/Arenas";
import { useAppCtx } from "../../contexts/AppContexts";
import HidePlaceholderIcon from "../../plasmic/plasmic_kit/PlasmicIcon__HidePlaceholder";
import ShowPlaceholderIcon from "../../plasmic/plasmic_kit/PlasmicIcon__ShowPlaceholder";
import {
  DefaultViewButtonProps,
  PlasmicViewButton,
} from "../../plasmic/plasmic_kit_top_bar/PlasmicViewButton";
import Refresh2SvgIcon from "../../plasmic/q_4_icons/icons/PlasmicIcon__Refresh2Svg";
import { getComboForAction } from "../../shortcuts/studio/studio-shortcuts";
import { useStudioCtx } from "../../studio-ctx/StudioCtx";
import { MenuBuilder, TextAndShortcut } from "../menu-builder";
import { IFrameAwareDropdownMenu } from "../widgets";
import { Icon } from "../widgets/Icon";

interface ViewButtonProps extends DefaultViewButtonProps {}

const contentCreatorModeHelp = (
  <>
    <div>
      Content creator mode simplifies the UI and limits edits to ensure design
      consistency.
    </div>
    <div className="mt-sm">
      Specifically it limits insertion to only existing components in the
      current project, hides all style settings, and hides most design panes.
    </div>
    <div className="mt-sm">
      If you create a team with content creator roles, those users are always in
      content creator mode.
    </div>
  </>
);

const ViewButton = observer(function ViewButton(props: ViewButtonProps) {
  const studioCtx = useStudioCtx();
  const appCtx = useAppCtx();
  const vc = studioCtx.focusedViewCtx();
  const showSlotPlaceholder = studioCtx.showSlotPlaceholder();
  const showContainerPlaceholder = studioCtx.showContainerPlaceholder();
  const showMultiplayerSelections = studioCtx.showMultiplayerSelections();
  const showAncestorsHoverBoxes = studioCtx.showAncestorsHoverBoxes();

  return (
    <IFrameAwareDropdownMenu
      menu={() => {
        const builder = new MenuBuilder();
        builder.genSection(undefined, (push) => {
          push(
            <Menu.Item
              onClick={async () => studioCtx.toggleShowSlotPlaceholder()}
              key="toggle-show-slot-placeholder"
            >
              <Icon
                className="dimfg mr-sm"
                icon={
                  showSlotPlaceholder
                    ? HidePlaceholderIcon
                    : ShowPlaceholderIcon
                }
              />
              {showSlotPlaceholder ? "Hide " : "Show "} placeholders for empty
              slots
            </Menu.Item>
          );
          push(
            <Menu.Item
              onClick={async () => studioCtx.toggleShowContainerPlaceholder()}
              key="toggle-show-container-placeholder"
            >
              <Icon
                className="dimfg mr-sm"
                icon={
                  showContainerPlaceholder
                    ? HidePlaceholderIcon
                    : ShowPlaceholderIcon
                }
              />
              {showContainerPlaceholder ? "Hide " : "Show "} placeholders for
              empty containers
            </Menu.Item>
          );
          push(
            <Menu.Item
              onClick={async () => studioCtx.toggleShowMultiplayerSelections()}
              key="toggle-show-multiplayer"
            >
              <Icon
                className="dimfg mr-sm"
                icon={
                  showMultiplayerSelections
                    ? HidePlaceholderIcon
                    : ShowPlaceholderIcon
                }
              />
              {showMultiplayerSelections ? "Hide " : "Show "} cursors and
              selections from other users
            </Menu.Item>
          );
          if (
            DEVFLAGS.ancestorsBoxes ||
            studioCtx.appCtx.appConfig.ancestorsBoxes
          ) {
            push(
              <Menu.Item
                onClick={async () => studioCtx.toggleShowAncestorsHoverBoxes()}
                key="toggle-show-ancestors-hover-boxes"
              >
                <Icon
                  className="dimfg mr-sm"
                  icon={
                    showSlotPlaceholder
                      ? HidePlaceholderIcon
                      : ShowPlaceholderIcon
                  }
                />
                {showAncestorsHoverBoxes ? "Hide " : "Show "} container outlines
                when hovering
              </Menu.Item>
            );
          }

          if (vc) {
            const isOutlineMode = vc.canvasCtx.isOutlineMode();
            push(
              <Menu.Item
                onClick={() =>
                  vc.canvasCtx.setOutlineMode(!vc.canvasCtx.isOutlineMode())
                }
                key="toggle-show-outline"
              >
                <TextAndShortcut shortcut={getComboForAction("OUTLINE_MODE")}>
                  {isOutlineMode ? "Hide " : "Show "} outline mode
                </TextAndShortcut>
              </Menu.Item>
            );
          }

          const isFocusedMode = studioCtx.focusedMode;
          if (isFocusedMode || isDedicatedArena(studioCtx.currentArena)) {
            push(
              <Menu.Item
                onClick={async () =>
                  studioCtx.changeUnsafe(() => studioCtx.toggleFocusedMode())
                }
                key="toggle-focus-mode"
              >
                <TextAndShortcut
                  shortcut={getComboForAction("TOGGLE_FOCUSED_MODE")}
                >
                  {isFocusedMode ? "Turn on " : "Turn off "} design mode
                </TextAndShortcut>
              </Menu.Item>
            );
          }

          const canChangeContentEditorMode =
            !studioCtx.isContentEditor() && !DEVFLAGS.contentEditorMode;
          if (canChangeContentEditorMode) {
            push(
              <Menu.Item
                onClick={async () =>
                  await studioCtx.change(({ success }) => {
                    studioCtx.toggleContentEditorMode();
                    return success();
                  })
                }
                key="toggle-content-editor-mode"
              >
                <Tooltip zIndex={200000} title={contentCreatorModeHelp}>
                  {studioCtx.contentEditorMode ? "Turn off " : "Turn on "}{" "}
                  content creator mode
                </Tooltip>
              </Menu.Item>
            );
          }

          push(
            <Menu.Item
              onClick={async () => {
                await studioCtx.refreshFetchedDataFromPlasmicQuery();
                await studioCtx.refreshAppUserProperties();
              }}
              key="refresh-data"
            >
              <Icon className="dimfg mr-sm" icon={Refresh2SvgIcon} />
              Refresh data
            </Menu.Item>
          );
        });

        return builder.build({
          menuName: "view-menu",
        });
      }}
    >
      <PlasmicViewButton
        mode={props.mode}
        root={{
          props: {
            ...props,
            id: "view-menu",
          },
        }}
      />
    </IFrameAwareDropdownMenu>
  );
});

export default ViewButton;
