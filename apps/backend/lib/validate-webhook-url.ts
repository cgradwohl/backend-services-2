export const validateUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);

    const { hostname, port, protocol } = parsedUrl;
    // validate local servers
    if (!hostname || isLocalhost(hostname)) {
      return false;
    }
    // validate port
    if (port && !["443", "80"].includes(port)) {
      return false;
    }
    // validate protocol
    if (protocol !== "https:") {
      return false;
    }
  } catch (err) {
    return false;
  }
  return true;
};

// borrowed from
// https://github.com/yyx990803/register-service-worker/blob/master/src/index.js#L8
const isLocalhost = (hostname: string) =>
  Boolean(
    hostname === "localhost" ||
      // [::1] is the IPv6 localhost address.
      hostname === "[::1]" ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
