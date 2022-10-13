import { XSSEncode } from "htmlencode";
import marked from "marked";
import { ValueJSON } from "slate";

import s3 from "~/lib/s3";
import slateToMd from "~/lib/slate/slate-to-md";

export interface INotes {
  html: string;
  markdown: string;
  slate: ValueJSON;
  updated: number;
  updater: string;
}

const notes = s3<INotes>(process.env.S3_NOTES_BUCKET);

export default (tenantId: string, userId: string) => {
  const del = async (id: string) => {
    const key = `${tenantId}/${id}.json`;
    await notes.delete(key);
  };

  const get = async (id: string) => {
    const key = `${tenantId}/${id}.json`;
    return await notes.get(key);
  };

  const put = async (id: string, slate: ValueJSON) => {
    const key = `${tenantId}/${id}.json`;
    const markdown = slateToMd(slate);
    const html = marked(XSSEncode(markdown), {
      breaks: true,
      xhtml: true,
    }).replace(/\r?\n/gm, "");

    await notes.put(key, {
      html,
      markdown,
      slate,
      updated: Date.now(),
      updater: userId,
    });

    return markdown.trim() !== "" ? key : undefined;
  };

  return {
    del,
    get,
    put,
  };
};
