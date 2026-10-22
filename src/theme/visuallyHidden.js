/**
 * The style of text that only assistive technology reads.
 *
 * The text stays in the accessibility tree, so a screen reader announces it,
 * but it takes up no room on the page.
 */
export const visuallyHiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};
