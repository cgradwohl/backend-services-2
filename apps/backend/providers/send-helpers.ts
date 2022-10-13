export const encodeUrlData = (body: any): String => {
  const data = Object.keys(body)
    .map((key) => `${key}=${encodeURIComponent(body[key])}`)
    .join("&");

  return data;
};
