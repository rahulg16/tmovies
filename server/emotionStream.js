import { StringDecoder } from "node:string_decoder";
import { Transform } from "node:stream";

const NONCE_ATTRIBUTE = (nonce) =>
  nonce ? ` nonce="${String(nonce).replace(/"/g, "&quot;")}"` : "";

const styleTag = (cache, key, ids, css) =>
  `<style data-emotion="${key} ${ids.join(" ")}"${NONCE_ATTRIBUTE(
    cache.nonce
  )}>${css}</style>`;

/**
 * Builds the `<style>` tags for a set of Emotion cache ids.
 *
 * Emotion's server renderer groups global styles into one tag each and all
 * component styles into a single tag, in that order. Matching that shape keeps
 * the markup produced while streaming identical to what the client cache
 * expects to find in `<head>`.
 */
export function buildStyleTags(cache, ids) {
  const regularIds = [];
  let regularCss = "";
  const tags = [];

  ids.forEach((id) => {
    const css = cache.inserted[id];

    if (!css || css === true) return;

    if (cache.registered[`${cache.key}-${id}`]) {
      regularIds.push(id);
      regularCss += css;
      return;
    }

    tags.push(styleTag(cache, `${cache.key}-global`, [id], css));
  });

  if (regularCss) {
    tags.push(styleTag(cache, cache.key, regularIds, regularCss));
  }

  return tags.join("");
}

const serializeForScript = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

/**
 * Finds the next React reveal script in the stream: `$RC` for content that
 * loaded, `$RX` for an error boundary that took over.
 */
function revealIndex(text) {
  const content = text.indexOf("$RC(");
  const error = text.indexOf("$RX(");

  if (content === -1) return error;
  if (error === -1) return content;

  return Math.min(content, error);
}

/**
 * A `Transform` that watches React's streaming output for a Suspense reveal
 * and flushes the styles Emotion collected for that chunk into `<head>` before
 * the reveal runs.
 *
 * The injected `<script>` removes itself, so React hydration sees exactly the
 * DOM the server rendered.
 */
export function createEmotionStream(cache, { sentIds, nonce } = {}) {
  const sent = sentIds || new Set();
  const decoder = new StringDecoder("utf8");
  let buffer = "";

  const flushStyles = () => {
    const ids = Object.keys(cache.inserted).filter(
      (id) => !sent.has(id) && cache.inserted[id] !== true
    );

    if (ids.length === 0) return "";

    ids.forEach((id) => sent.add(id));

    const tags = buildStyleTags(cache, ids);

    if (!tags) return "";

    const script = [
      "(function(){",
      "var head=document.head;",
      `head.insertAdjacentHTML("beforeend",${serializeForScript(tags)});`,
      "var script=document.currentScript;",
      "if(script){script.remove();}",
      "})();",
    ].join("");

    return `<script${NONCE_ATTRIBUTE(nonce)}>${script}</script>`;
  };

  return new Transform({
    transform(chunk, encoding, callback) {
      buffer += decoder.write(chunk);

      // React writes a hidden Suspense subtree followed by a script that moves
      // it into place. Insert the styles before that script so the reveal
      // paints with the right CSS.
      let marker = revealIndex(buffer);

      while (marker !== -1) {
        const scriptStart = buffer.lastIndexOf("<script", marker);
        const scriptEnd = buffer.indexOf("</script>", marker);

        if (scriptStart === -1 || scriptEnd === -1) break;

        const end = scriptEnd + "</script>".length;

        this.push(buffer.slice(0, scriptStart));
        this.push(flushStyles());
        this.push(buffer.slice(scriptStart, end));

        buffer = buffer.slice(end);
        marker = revealIndex(buffer);
      }

      // Never flush a partially received <script> tag: a $RC script could be
      // split across chunks, and inserting our script inside it would break
      // the document.
      const lastOpen = buffer.lastIndexOf("<script");
      const lastClose = buffer.lastIndexOf("</script>");
      const safeEnd =
        lastOpen > lastClose
          ? lastOpen
          : Math.max(0, buffer.length - 64);

      if (safeEnd > 0) {
        this.push(buffer.slice(0, safeEnd));
        buffer = buffer.slice(safeEnd);
      }

      callback();
    },

    flush(callback) {
      buffer += decoder.end();

      const trailingStyles = flushStyles();

      if (trailingStyles) this.push(trailingStyles);
      if (buffer) this.push(buffer);

      callback();
    },
  });
}

export default createEmotionStream;
