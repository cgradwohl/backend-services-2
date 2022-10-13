import parseISO from "date-fns/parseISO";

const iso = parseISO("2015-02-17T18:30:20.000Z");
const time = iso.getTime();

const mockData = {
  time,
  characters: [
    {
      id: "luke",
      name: "Luke Skywalker",
      weapons: [{ name: "lightsaber", weaponId: "lightsaber" }],
    },
    {
      id: "boba-fett",
      name: "Boba Fett",
      weapons: [
        { name: "blaster", weaponId: "blaster" },
        { name: "Z-6 Jetpack", weaponId: "z-6-jetpack" },
        { name: "flame thrower", weaponId: "flame-thrower" },
      ],
    },
    {
      id: "han",
      name: "Han Solo",
      weapons: [{ name: "blaster pistol", weaponId: "blaster-pistol" }],
    },
  ],
  color: "#E0218A",
  emptyArray: [],
  escape: "Should escape &, <, >, \", ', `, and = characters",
  escapeLink: "https://example.com/?a=1&b=2&c=3",
  markdownMessageWithTags:
    "**markdown** needs to support html <em>tags</em>.\n\nAs well as new lines<br><br>and new lines created by using &lt;br&gt;.",
  message: "Give yourself to the Dark Side.",
  name: "Luke",
  object: {
    id: "parent-object",
    name: "Parent object",
    object: {
      id: "child-object",
      name: "Child object",
    },
  },
  url: "https://example.com",
  withLineReturns: "Line 1\nLine 2\n\nLine 4",
  withWindowsLineReturns: "line 1\r\nline 2\r\n\r\nline 4",
};

export default mockData;
