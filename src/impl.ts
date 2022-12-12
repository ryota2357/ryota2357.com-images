import {
  type CanvasRenderingContext2D,
  createCanvas,
  loadImage,
  registerFont,
} from "canvas";
import * as fs from "fs";
import { parse as parsePath } from "path";

type Px = number;
type Em = number;

export type Params = {
  image: {
    path: string;
    width: Px;
    height: Px;
  };
  text: {
    text: string;
    font: {
      path: string;
      family: string;
      size: Px;
    };
    style: {
      lineHeight: Em;
      padding: {
        top: Px;
        left: Px;
        bottom: Px;
        right: Px;
      };
    };
  };
};

const setupCanvas = async ({
  font,
  image,
}: {
  font: Params["text"]["font"];
  image: Params["image"];
}) => {
  registerFont(font.path, { family: font.family });
  const img = await loadImage(fs.readFileSync(image.path));
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(img, 0, 0, image.width, image.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${font.size}px ${font.family}`;
  return canvas;
};

const textSize = (context: CanvasRenderingContext2D, text: string) => {
  const measure = context.measureText(text);
  const width = measure.width;
  const height =
    measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
  return { width, height };
};

const splitLine = ({
  context,
  maxWidth,
  text,
}: {
  context: CanvasRenderingContext2D;
  maxWidth: number;
  text: string;
}) => {
  const splitWord = (text: string) => {
    const isEnChar = (char: string) => {
      if (char.length != 1) {
        throw Error(`char length must be 1. length is ${char}`);
      }
      return /[A-z]|_|\$|<|>/.test(char);
    };

    const ret = [""];
    for (const now of text) {
      const prev = ret[ret.length - 1].slice(-1);
      if (prev == "" || (isEnChar(prev) && isEnChar(now))) {
        ret[ret.length - 1] += now;
        continue;
      }
      ret.push(now);
    }
    return ret;
  };

  const ret = [""];
  for (const now of splitWord(text)) {
    const next = ret[ret.length - 1] + now;
    if (textSize(context, next).width > maxWidth) {
      ret.push(now);
    } else {
      ret[ret.length - 1] += now;
    }
  }
  return ret;
};

const writeText = ({
  context,
  text,
  width,
  height,
  style,
}: {
  context: CanvasRenderingContext2D;
  text: string;
  width: Px;
  height: Px;
  style: Params["text"]["style"];
}) => {
  const maxWidth = width - (style.padding.left + style.padding.right);
  const textHight = textSize(context, text).height * style.lineHeight;
  const lines = splitLine({
    context: context,
    maxWidth: maxWidth,
    text: text,
  });

  let x = style.padding.left + maxWidth / 2;
  let y = (() => {
    const area = height - (style.padding.top + style.padding.bottom);
    const use = lines.length * textHight;
    if (area - use < 0) {
      throw Error("Threr are not enough area to draw text");
    }
    const offset = (textHight / 2) * (lines.length - 1);
    return style.padding.top + area / 2 - offset;
  })();

  for (const line of lines) {
    context.fillText(line, x, y);
    y += textHight;
  }
};

export const generateImage = async (params: Params) => {
  const canvas = await setupCanvas({
    image: params.image,
    font: params.text.font,
  });

  writeText({
    context: canvas.getContext("2d"),
    text: params.text.text,
    width: params.image.width,
    height: params.image.height,
    style: params.text.style,
  });

  return canvas.toBuffer("image/png");
};

export const writeFileSafe = (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  callback: fs.NoParamCallback
) => {
  const dir = parsePath(path).dir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFile(path, data, callback);
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer UU>
    ? ReadonlyArray<DeepPartial<UU>>
    : DeepPartial<T[P]>;
};
