import { resolve, join } from "path";
import * as fs from "fs";
import { generateImage } from "./impl";
import { simpleGit } from "simple-git";

const step = (message: string) => {
  console.log("==> " + message);
};

const main = async () => {
  step("Clean and create ./output");
  const output = resolve("./output");
  if (fs.existsSync(output)) {
    fs.rmSync(output, { recursive: true });
  }
  fs.mkdirSync(join(output, "2021"), { recursive: true });
  fs.mkdirSync(join(output, "2022"), { recursive: true });

  step("Clone repo");
  const git_url = "https://github.com/ryota2357/ryota2357-github-pages.git";
  const repo = resolve("./repo");
  await simpleGit().clone(git_url, repo);

  step("Collect data");
  const data: { slug: string; title: string }[] = [];
  for (const year of ["2021", "2022"]) {
    const targetDir = resolve(join(repo, "content", "post", year));
    for (const entry of fs.readdirSync(targetDir)) {
      const path = join(targetDir, entry, "index.md");
      if (fs.existsSync(path)) {
        data.push({
          slug: join(year, entry),
          title: (() => {
            const titleLine = fs
              .readFileSync(path, { encoding: "utf-8" })
              .split("\n")[1];
            return /"(.*)"/.exec(titleLine)?.[1]?.toString() ?? "No title";
          })(),
        });
      }
    }
  }

  step("Generate image");
  for (const one of data) {
    const image = await generateImage({
      image: {
        width: 1200,
        height: 630,
        path: resolve("./assets/base.png"),
      },
      text: {
        text: one.title,
        font: {
          path: resolve("./assets/IBMPlexSansJP-SemiBold.otf"),
          family: "IBMPlexSansJP",
          size: 56,
        },
        style: {
          lineHeight: 1.7,
          padding: {
            top: 60,
            left: 100,
            bottom: 140,
            right: 100,
          },
        },
      },
    });

    fs.writeFile(join(output, `${one.slug}.png`), image, (e) => {
      if (e) throw e;
      console.log(`Generated ${one.slug}.png`);
    });
  }

  step("Remove repo");
  fs.rmSync(repo, { recursive: true });
};

main();
