import { resolve, join, parse, relative } from "path";
import { walkSync } from "walk";
import * as fs from "fs";
import {
  type Params,
  type DeepPartial,
  generateImage,
  writeFileSafe,
} from "./impl";
import { simpleGit } from "simple-git";

const step = (message: string) => {
  console.log("==> " + message);
};

const createParams = (s: DeepPartial<Params>): Params => {
  return {
    image: {
      width: s?.image?.width ?? 1200,
      height: s?.image?.height ?? 630,
      path: s?.image?.path ?? resolve("./assets/1200x630.png"),
    },
    text: {
      text: s?.text?.text ?? "No title",
      font: {
        path:
          s?.text?.font?.path ?? resolve("./assets/IBMPlexSansJP-SemiBold.otf"),
        family: s?.text?.font?.family ?? "IBMPlexSansJP",
        size: s?.text?.font?.size ?? 56,
      },
      style: {
        lineHeight: s.text?.style?.lineHeight ?? 1.7,
        padding: {
          top: s.text?.style?.padding?.top ?? 100,
          left: s.text?.style?.padding?.left ?? 100,
          bottom: s.text?.style?.padding?.bottom ?? 100,
          right: s.text?.style?.padding?.right ?? 100,
        },
      },
    },
  };
};

const main = async () => {
  step("Clean ./output");
  const output = resolve("./output");
  if (fs.existsSync(output)) {
    fs.rmSync(output, { recursive: true });
  }

  step("Clone repo");
  const git_url = "https://github.com/ryota2357/ryota2357.com.git";
  const repo = resolve("./repo");
  await simpleGit().clone(git_url, repo, { "--depth": "1" });

  step("Collect data");
  const data: { slug: string; params: Params }[] = [];
  {
    // blog-post
    for (const year of ["2021", "2022", "2023"]) {
      const targetDir = resolve(join(repo, "content", "post", year));
      for (const entry of fs.readdirSync(targetDir)) {
        const path = join(targetDir, entry, "index.md");
        if (fs.existsSync(path)) {
          data.push({
            slug: join("blog", year, entry),
            params: createParams({
              image: { path: resolve("./assets/post.png") },
              text: {
                text: (() => {
                  const titleLine = fs
                    .readFileSync(path, { encoding: "utf-8" })
                    .split("\n")[1];
                  return /"(.*)"/.exec(titleLine)?.[1]?.toString();
                })(),
                style: { padding: { top: 60, bottom: 140 } },
              },
            }),
          });
        }
      }
    }

    // pages
    const pagesDir = resolve(join(repo, "src", "pages"));
    walkSync(pagesDir, {
      listeners: {
        file: (root, fileStats) => {
          if (/index/.test(fileStats.name) && root == pagesDir) return;
          const page = (() => {
            const p = relative(pagesDir, join(root, fileStats.name));
            const o = parse(p);
            return join(o.dir, o.name);
          })();
          data.push({
            slug: page,
            params: createParams({
              image: { path: resolve("./assets/page.png") },
              text: {
                text: `ryota2357.${page.replaceAll("/", ".")}`,
                font: { size: 92 },
              },
            }),
          });
        },
      },
    });
  }

  step("Generate image");
  for (const one of data) {
    const image = await generateImage(one.params);
    writeFileSafe(join(output, `${one.slug}.png`), image, (e) => {
      if (e) throw e;
      console.log(`Generated ${one.slug}.png`);
    });
  }

  step("Remove repo");
  fs.rmSync(repo, { recursive: true });
};

main();
