// This is a skeleton starter React component generated by Plasmic.
// This file is owned by you, feel free to edit as you see fit.
import * as React from "react";
import { ModalProps } from "../../../../../Modal";
import {
  DefaultCardPickerModalProps,
  PlasmicCardPickerModal,
} from "../../../plasmic/plasmic_kit_component_props_section/PlasmicCardPickerModal";

export interface CardPickerModalProps
  extends DefaultCardPickerModalProps,
    ModalProps {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export default function CardPickerModal(props: CardPickerModalProps) {
  const { onChange, onKeyDown, onCancel, onSave, ...rest } = props;
  return (
    <PlasmicCardPickerModal
      {...rest}
      textbox={{
        onChange,
        onKeyDown,
      }}
      cancelButton={{
        onClick: onCancel,
      }}
      saveButton={{
        onClick: onSave,
      }}
    />
  );
}
