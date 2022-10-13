import generateWorkspaceName from "~/lib/generate-workspace-name";

const tenantNames = ["CobraKai", "Johnny's workspace", "Johnny2's workspace"];

describe("When generating a workspace name", () => {
  describe("When no other tenants exist", () => {
    it("will return a workspace name for a free domain", () => {
      const result = generateWorkspaceName(
        "Johnny@gmail.com",
        { domain: "gmail.com", isCompanyEmail: false },
        []
      );
      expect(result).toBe("Johnny's workspace");
    }),
      it("will return a workspace name for a custom domain provided by Kickbox", () => {
        const result = generateWorkspaceName(
          "Johnny@cobraKai.com",
          { domain: "CobraKai.com", isCompanyEmail: true },
          []
        );
        expect(result).toBe("CobraKai");
      }),
      it("will return a workspace name for a custom domain not provided by kickbox", () => {
        const result = generateWorkspaceName(
          "Johnny@cobraKai.com",
          { domain: "", isCompanyEmail: true },
          []
        );
        expect(result).toBe("CobraKai");
      });
  });

  describe("When other tenants exist, but are not duplicates", () => {
    it("will return a workspace named after the user even if domain is not free", () => {
      const result = generateWorkspaceName(
        "Johnny@cobraKai.com",
        { domain: "cobraKai.com", isCompanyEmail: true },
        [tenantNames[0]]
      );
      expect(result).toBe("Johnny's workspace");
    });
  }),
    describe("When other tenants exist and there are duplicates", () => {
      it("will return a workspace named after the user with a number appended even if domain is not free", () => {
        const result = generateWorkspaceName(
          "Johnny@gcobraKai.com",
          { domain: "cobraKai.com", isCompanyEmail: true },
          tenantNames
        );
        expect(result).toBe("Johnny3's workspace");
      });
    });
});
