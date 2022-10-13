import validLink from "./valid-link";

export interface ILinkOptions {
  href: string;
  text?: string;
}

export interface IWebhookOptions {
  actionId?: string;
  text?: string;
  isWebhook: true;
}

export interface ILinkData {
  context: string;
  options: ILinkOptions | IWebhookOptions;
  renderCount?: number;
  trackingHref?: string;
  trackingId?: string;
}

export interface ILinkHandler {
  addLink: (context: string | number, options: ILinkOptions) => void;
  addWebhook: (
    context: string | number,
    options: Omit<IWebhookOptions, "isWebhook">
  ) => void;
  getHref: (context: string | number, href: string) => string;
  getPrefixedHandler: (prefix: string | number) => ILinkHandler;
  getScopedHandler: (context: string | number) => ILinkHandler;
  getTrackingId: (context: string) => string;
  handleHref: (options: ILinkOptions, context: string | number) => string;
  handleWebhook: (options: IWebhookOptions, context: string | number) => string;
  supportsWebhook: boolean;
  trackingEnabled: boolean;
  trackingHandler?: (context: string) => void;
}

export const isLinkOptions = (
  options: ILinkData["options"]
): options is ILinkOptions => {
  return !(options as IWebhookOptions).isWebhook;
};

function createClickTrackingLinkHandler(
  links: { [context: string]: ILinkData },
  supportsWebhook: boolean,
  parentContext: string = "$.",
  trackingHandler?: (context: string) => void
): ILinkHandler {
  let contextIndex = 0;

  const getFullContext = (context: string | number) => {
    const fullContext = parentContext + context;

    // context must be unique!
    if (fullContext in links) {
      throw new Error(`Context must be unique [${fullContext}]`);
    }

    return fullContext;
  };

  const addLink: ILinkHandler["addLink"] = (
    context: string,
    options: ILinkOptions
  ) => {
    /**
     * Validate that the href is a fully-qualified URL. Any URLs that the browser
     * might construe as a relative URL will break the click-through tracking redirect.
     */
    if (!validLink(options.href)) {
      return;
    }

    const fullContext = getFullContext(context);
    const linkData: ILinkData = {
      context: fullContext,
      options,
    };
    links[fullContext] = linkData;
  };

  const addWebhook: ILinkHandler["addWebhook"] = (context, options) => {
    const fullContext = getFullContext(context);
    const linkData: ILinkData = {
      context: fullContext,
      options: {
        ...options,
        isWebhook: true,
      },
    };
    links[fullContext] = linkData;
  };

  const getDiscoveryData = (context: string | number) => {
    const fullContext = parentContext + context;
    const discoveryData = links[fullContext];

    if (!discoveryData) {
      throw new Error(
        `Context was not found during link discovery: [${
          parentContext + context
        }]}`
      );
    }

    if ("renderCount" in discoveryData && discoveryData.renderCount > 0) {
      throw new Error(
        `Link has already been rendered: [${fullContext}]\n${JSON.stringify(
          discoveryData.options,
          null,
          2
        )}`
      );
    }

    discoveryData.renderCount = (discoveryData.renderCount || 0) + 1;

    return discoveryData;
  };

  const getHref: ILinkHandler["getHref"] = (context, href) => {
    /**
     * Validate that the href is a fully-qualified URL. Any URLs that the browser
     * might construe as a relative URL will break the click-through tracking redirect.
     */
    if (!validLink(href)) {
      return href;
    }

    const discoveryData = getDiscoveryData(context);

    if (
      isLinkOptions(discoveryData.options) &&
      discoveryData.options.href !== href
    ) {
      throw new Error(
        `Link href did not match href from discovery: [${
          parentContext + context
        }] ${JSON.stringify(discoveryData.options.href)} ${JSON.stringify(
          href
        )}`
      );
    }

    // return url
    return discoveryData.trackingHref || href;
  };

  const getNextContext = () => {
    return contextIndex++;
  };

  const getScopedHandler = (context: string | number) => {
    return createClickTrackingLinkHandler(
      links,
      supportsWebhook,
      `${parentContext}${context}.`,
      trackingHandler
    );
  };

  const getPrefixedHandler = (prefix: string | number) => {
    const context = `$.${prefix}.${parentContext.substring(2)}`;
    return createClickTrackingLinkHandler(links, supportsWebhook, context);
  };

  const getTrackingId = (context: string | number) => {
    const discoveryData = getDiscoveryData(context);

    return discoveryData.trackingId;
  };

  /**
   * Handle registering the href, getting the tracking number, and returning the
   * href in one go
   */
  const handleHref = (
    options: ILinkOptions,
    context: string | number = getNextContext()
  ): string => {
    if (!trackingHandler) {
      throw new Error("handleHref() needs a trackingHandler");
    }

    /**
     * Validate that the href is a fully-qualified URL. Any URLs that the browser
     * might construe as a relative URL will break the click-through tracking redirect.
     */
    if (!validLink(options.href)) {
      // don't add to ctt records
      return options.href;
    }

    const fullContext = parentContext + context;

    addLink(context, options);
    trackingHandler(fullContext);
    return getHref(context, options.href);
  };

  /**
   * Handle registering the webhook, getting the tracking number, and returning
   * the trackingId in one go
   */
  const handleWebhook = (
    options: IWebhookOptions,
    context: string | number = getNextContext()
  ): string => {
    if (!trackingHandler) {
      throw new Error("handleWebhook() needs a trackingHandler");
    }

    const fullContext = parentContext + context;

    addWebhook(context, options);
    trackingHandler(fullContext);
    return getTrackingId(context);
  };

  const handler: ILinkHandler = {
    addLink,
    addWebhook,
    getHref,
    getPrefixedHandler,
    getScopedHandler,
    getTrackingId,
    handleHref,
    handleWebhook,
    supportsWebhook,
    trackingEnabled: true,
    trackingHandler,
  };

  return handler;
}

function createLinkHandler(
  links: { [context: string]: ILinkData },
  trackingEnabled: boolean = false,
  supportsWebhook: boolean = false,
  trackingHandler?: (context: string) => void
): ILinkHandler {
  if (trackingEnabled) {
    return createClickTrackingLinkHandler(
      links,
      supportsWebhook,
      undefined,
      trackingHandler
    );
  }

  const noClickTrackingHandler: ILinkHandler = {
    addLink: () => undefined,
    addWebhook: () => undefined,
    getHref: (context, href) => href,
    getPrefixedHandler: () => noClickTrackingHandler,
    getScopedHandler: () => noClickTrackingHandler,
    getTrackingId: () => "",
    handleHref: ({ href }: ILinkOptions) => href,
    handleWebhook: ({ actionId }: IWebhookOptions) => actionId,
    supportsWebhook,
    trackingEnabled,
    trackingHandler,
  };

  return noClickTrackingHandler;
}

export default createLinkHandler;
