import FormData from "form-data";

const getAttachmentOptions = (
  item: any
): {
  filename?: string;
  contentType?: string;
  knownLength?: number;
} => {
  const { filename, contentType, knownLength } = item;

  return {
    ...(filename ? { filename } : { filename: "file" }),
    ...(contentType && { contentType }),
    ...(knownLength && { knownLength }),
  };
};

export function createFormData(data: any): FormData {
  const appendFileToFD = (
    key: string,
    obj: any,
    formDataInstance: FormData
  ): void => {
    const objData = obj.data;
    const options = getAttachmentOptions(obj);
    formDataInstance.append(key, objData, options.filename);
  };

  const formData: FormData = Object.keys(data)
    .filter((key) => data[key])
    .reduce((formDataAcc, key) => {
      if (key === "attachment" || key === "inline") {
        const obj = data[key];

        if (Array.isArray(obj)) {
          obj.forEach((item) => {
            appendFileToFD(key, item, formDataAcc);
          });
        } else {
          appendFileToFD(key, obj, formDataAcc);
        }

        return formDataAcc;
      }

      if (Array.isArray(data[key])) {
        data[key].forEach((item: any) => {
          formDataAcc.append(key, item);
        });
      } else if (data[key] != null) {
        formDataAcc.append(key, data[key]);
      }
      return formDataAcc;
      // eslint-disable-next-line new-cap
    }, new FormData());
  return formData;
}
