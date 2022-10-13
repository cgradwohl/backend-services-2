import { validateBase64Image } from "~/lib/images";

describe("valid", () => {
  it("will return buffer", async () => {
    const response = await validateBase64Image({
      type: "image/png",
      name: "image.png",
      data:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAoCAMAAACPWYlDAAAAAXNSR0IArs4c6QAAAD9QTFRF/ZgAAAAA/6UA/5oA/pkA/pkA/pgA/58A/5oA/pkA/6EA/pkA/pgA/pkA/5oA/5oA/6oA/pgA/5wA//8A/pgAyL5ExwAAABV0Uk5T/wARYK/Z8wh58BvL5PJ+MAy9HwGudCXWhgAAAMRJREFUOI3tlNsOgjAMhnFnBuyE7/+sthh0hrW6xERN7E3ZXz7Wrh3D0LQTae33Pw8cpT/QBwiptDFaSfESYN24t2Z09gaQjfNTLU7+GeDnR3X2PGC37y8hphTDsu1hWcDhUy7X3UrGleOKFlhvXnd5RWIUDCAxn3LXC2YlGUCBD3UggKAYQIOPdSCCoBnAgE91IIFg3gl0p9Qs+sw0jjnWNsA0rns0CIAevnbRzHhTAHmBSIC6ojTQ/RM42rcCRON+BbgA/n0Jtasvh2wAAAAASUVORK5CYII=",
    });

    expect(response.filename).toBe("image.png");
    expect(Buffer.isBuffer(response.buffer)).toBe(true);
  });

  it("will reject content type mismatch from what we discover", async () => {
    const response = await validateBase64Image({
      type: "image/jpeg",
      name: "image.png",
      data:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAoCAMAAACPWYlDAAAAAXNSR0IArs4c6QAAAD9QTFRF/ZgAAAAA/6UA/5oA/pkA/pkA/pgA/58A/5oA/pkA/6EA/pkA/pgA/pkA/5oA/5oA/6oA/pgA/5wA//8A/pgAyL5ExwAAABV0Uk5T/wARYK/Z8wh58BvL5PJ+MAy9HwGudCXWhgAAAMRJREFUOI3tlNsOgjAMhnFnBuyE7/+sthh0hrW6xERN7E3ZXz7Wrh3D0LQTae33Pw8cpT/QBwiptDFaSfESYN24t2Z09gaQjfNTLU7+GeDnR3X2PGC37y8hphTDsu1hWcDhUy7X3UrGleOKFlhvXnd5RWIUDCAxn3LXC2YlGUCBD3UggKAYQIOPdSCCoBnAgE91IIFg3gl0p9Qs+sw0jjnWNsA0rns0CIAevnbRzHhTAHmBSIC6ojTQ/RM42rcCRON+BbgA/n0Jtasvh2wAAAAASUVORK5CYII=",
    }).catch(String);

    expect(response).toBe("Error: Invalid File");
  });

  it("will reject invalid filename", async () => {
    const response = await validateBase64Image({
      type: "image/png",
      name: "../image.png",
      data:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAoCAMAAACPWYlDAAAAAXNSR0IArs4c6QAAAD9QTFRF/ZgAAAAA/6UA/5oA/pkA/pkA/pgA/58A/5oA/pkA/6EA/pkA/pgA/pkA/5oA/5oA/6oA/pgA/5wA//8A/pgAyL5ExwAAABV0Uk5T/wARYK/Z8wh58BvL5PJ+MAy9HwGudCXWhgAAAMRJREFUOI3tlNsOgjAMhnFnBuyE7/+sthh0hrW6xERN7E3ZXz7Wrh3D0LQTae33Pw8cpT/QBwiptDFaSfESYN24t2Z09gaQjfNTLU7+GeDnR3X2PGC37y8hphTDsu1hWcDhUy7X3UrGleOKFlhvXnd5RWIUDCAxn3LXC2YlGUCBD3UggKAYQIOPdSCCoBnAgE91IIFg3gl0p9Qs+sw0jjnWNsA0rns0CIAevnbRzHhTAHmBSIC6ojTQ/RM42rcCRON+BbgA/n0Jtasvh2wAAAAASUVORK5CYII=",
    }).catch(String);

    expect(response).toBe("Error: Invalid File");
  });

  it("will reject invalid filename", async () => {
    const response = await validateBase64Image({
      type: "image/png",
      name: "space%20image.png",
      data:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAoCAMAAACPWYlDAAAAAXNSR0IArs4c6QAAAD9QTFRF/ZgAAAAA/6UA/5oA/pkA/pkA/pgA/58A/5oA/pkA/6EA/pkA/pgA/pkA/5oA/5oA/6oA/pgA/5wA//8A/pgAyL5ExwAAABV0Uk5T/wARYK/Z8wh58BvL5PJ+MAy9HwGudCXWhgAAAMRJREFUOI3tlNsOgjAMhnFnBuyE7/+sthh0hrW6xERN7E3ZXz7Wrh3D0LQTae33Pw8cpT/QBwiptDFaSfESYN24t2Z09gaQjfNTLU7+GeDnR3X2PGC37y8hphTDsu1hWcDhUy7X3UrGleOKFlhvXnd5RWIUDCAxn3LXC2YlGUCBD3UggKAYQIOPdSCCoBnAgE91IIFg3gl0p9Qs+sw0jjnWNsA0rns0CIAevnbRzHhTAHmBSIC6ojTQ/RM42rcCRON+BbgA/n0Jtasvh2wAAAAASUVORK5CYII=",
    }).catch(String);

    expect(response).toBe("Error: Invalid File");
  });

  it("will reject missing data", async () => {
    const response = await validateBase64Image({
      type: "image/jpeg",
      name: "../image.png",
      data: "",
    }).catch(String);

    expect(response).toBe("Error: Invalid File");
  });

  it("will reject non image data", async () => {
    const response = await validateBase64Image({
      type: "image/jpeg",
      name: "../image.png",
      data: "aGVsbG8gd29ybGQ=",
    }).catch(String);

    expect(response).toBe("Error: Invalid File");
  });
});
