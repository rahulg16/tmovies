import { buildStyleTags, createEmotionStream } from "../../server/emotionStream";

const makeCache = (overrides = {}) => ({
  key: "css",
  inserted: {},
  registered: {},
  ...overrides,
});

const runStream = (cache, parts) =>
  new Promise((resolve, reject) => {
    const stream = createEmotionStream(cache, { nonce: "test-nonce" });
    let output = "";

    stream.on("data", (chunk) => {
      output += chunk.toString();
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(output));

    parts.forEach((part) => {
      if (typeof part === "function") part();
      else stream.write(part);
    });

    stream.end();
  });

describe("the streaming style collector", () => {
  it("groups component styles into one tag after global styles", () => {
    const cache = makeCache({
      inserted: {
        first: ".first{color:red}",
        second: ".second{color:blue}",
        "css-global": "body{margin:0}",
      },
      registered: { "css-first": true, "css-second": true },
    });

    const html = buildStyleTags(cache, ["first", "css-global", "second"]);

    expect(html).toContain('data-emotion="css-global css-global"');
    expect(html).toContain("body{margin:0}");
    expect(html).toContain('data-emotion="css first second"');
    expect(html).toContain(".first{color:red}.second{color:blue}");
  });

  it("inserts new styles before a Suspense reveal", async () => {
    const cache = makeCache();

    const html = await runStream(cache, [
      "<html><body>",
      () => {
        cache.inserted.loaded = ".loaded{color:green}";
      },
      '<div hidden id="S:0">Loaded</div><script>$RC("B:0","S:0")</script>',
    ]);

    expect(html.indexOf(".loaded{color:green}")).toBeLessThan(
      html.indexOf("$RC(")
    );
    expect(html).toContain('nonce="test-nonce"');
  });

  it("inserts new styles before an error reveal", async () => {
    const cache = makeCache();

    const html = await runStream(cache, [
      "<html><body>",
      () => {
        cache.inserted.failed = ".failed{color:red}";
      },
      '<div hidden id="S:1">Error</div><script>$RX("B:1","S:1")</script>',
    ]);

    expect(html.indexOf(".failed{color:red}")).toBeLessThan(
      html.indexOf("$RX(")
    );
  });

  it("waits for a reveal script that arrives in two pieces", async () => {
    const cache = makeCache();

    const html = await runStream(cache, [
      "<html><body>",
      () => {
        cache.inserted.loaded = ".loaded{color:green}";
      },
      "<script>$RC",
      '("B:0","S:0")</script>',
    ]);

    expect(html).toContain(".loaded{color:green}");
    expect(html.indexOf("<script>$RC")).toBeGreaterThan(
      html.indexOf(".loaded{color:green}")
    );
  });
});
