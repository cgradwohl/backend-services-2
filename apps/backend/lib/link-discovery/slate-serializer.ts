import { ISerializableObject, Serializer } from "~/lib/render/blocks";
import serializeNode from "~/lib/serialize-node";

const slateLinkDiscoverySerializer: Serializer = (
  value,
  linkHandler,
  variableReplacer
): string => {
  const links = linkHandler.getScopedHandler("rich-text");
  let linkIndex = 0;

  const serializeLink = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "link") {
        return;
      }

      const rawHref = obj.data.get("href") || Array.from(children)[0];
      const href = variableReplacer(rawHref);
      const text = variableReplacer(children.trim());
      links.addLink(linkIndex++, { href, text });
      return "";
    },
  };

  const elements = serializeNode(value, [serializeLink]);

  return elements.join();
};

export default slateLinkDiscoverySerializer;
