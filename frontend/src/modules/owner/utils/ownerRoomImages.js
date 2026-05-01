export const OWNER_ROOM_IMAGE_ASSETS = {
  "owner-room-default": require("../../../assets/images/owner-room-default.png"),
  "owner-room-bright": require("../../../assets/images/owner-room-bright.png"),
  "owner-room-compact": require("../../../assets/images/owner-room-compact.png"),
};

export const OWNER_ROOM_IMAGE_OPTIONS = [
  { key: "owner-room-default", label: "Classic Room" },
  { key: "owner-room-bright", label: "Bright Room" },
  { key: "owner-room-compact", label: "Compact Room" },
];

export function resolveOwnerRoomImageSource(image) {
  if (!image) {
    return OWNER_ROOM_IMAGE_ASSETS["owner-room-default"];
  }

  if (OWNER_ROOM_IMAGE_ASSETS[image]) {
    return OWNER_ROOM_IMAGE_ASSETS[image];
  }

  return { uri: image };
}
