import { colors } from "../utils/colors";

export const SplitBorder = {
  border: ["left" as const],
  borderColor: colors.border,
  customBorderChars: {
    topLeft: "",
    bottomLeft: "",
    vertical: "┃",
    topRight: "",
    bottomRight: "",
    horizontal: "",
    bottomT: "",
    topT: "",
    cross: "",
    leftT: "",
    rightT: "",
  },
}
