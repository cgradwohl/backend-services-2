import handlebars from "handlebars";
import helper from "~/handlebars/helpers/email/column-width";

describe("column-width helper", () => {
  const compiledHbs = handlebars.compile(
    `{{column-width size layout=layout width=width index=index groupColumns=groupColumns}}`
  );

  beforeEach(() => {
    handlebars.registerHelper("column-width", helper);
  });

  it("return nothing if no width provided and layout === left", () => {
    expect(
      compiledHbs({
        size: 2,
        layout: "left",
        index: 0,
      })
    ).toBe("");
  });

  it("return nothing if width provided and layout === left but size > 2", () => {
    expect(
      compiledHbs({
        size: 3,
        layout: "left",
        width: "100px",
        index: 0,
      })
    ).toBe("");
  });

  it("return nothing if layout is center and width is provided", () => {
    expect(
      compiledHbs({
        size: 2,
        layout: "center",
        index: 0,
        width: "25%",
      })
    ).toBe("");
  });

  it("return columns width if layout === left and width is %", () => {
    const width = "25%";
    expect(
      compiledHbs({
        size: 2,
        layout: "left",
        width,
        index: 0,
      })
    ).toBe(`width=\"${width}\"`);

    expect(
      compiledHbs(
        {
          size: 2,
          layout: "left",
          width,
          index: 1,
        },
        {
          data: {
            templateWidth: "582px",
          },
        }
      )
    ).toBe('width="75%"');
  });

  it("return column widths if layout === left and width is px", () => {
    const width = "120px";
    expect(
      compiledHbs({
        size: 2,
        layout: "left",
        width,
        index: 0,
      })
    ).toBe(`width=\"${width}\"`);

    expect(
      compiledHbs(
        {
          size: 2,
          layout: "left",
          width,
          index: 1,
        },
        {
          data: {
            templateWidth: "582px",
          },
        }
      )
    ).toBe('width="399px"');
  });

  it("return columns flipped with layout is `right`", () => {
    const width = "120px";
    expect(
      compiledHbs(
        {
          size: 2,
          layout: "right",
          width,
          index: 0,
        },
        {
          data: {
            columns: [{}, {}],
            templateWidth: "582px",
          },
        }
      )
    ).toBe('width="399px"');

    expect(
      compiledHbs(
        {
          size: 2,
          layout: "right",
          width,
          index: 1,
        },
        {
          data: {
            columns: [{}, {}],
            templateWidth: "582px",
          },
        }
      )
    ).toBe(`width=\"${width}\"`);
  });

  it("will return % for all columns if groupColumns is true and width is px", () => {
    const width = "120px";
    expect(
      compiledHbs(
        {
          size: 2,
          layout: "left",
          groupColumns: true,
          width,
          index: 0,
        },
        {
          data: {
            columns: [{}, {}],
            templateWidth: "582px",
          },
        }
      )
    ).toBe('width="20%"');

    expect(
      compiledHbs(
        {
          size: 2,
          layout: "left",
          groupColumns: true,
          width,
          index: 1,
        },
        {
          data: {
            columns: [{}, {}],
            templateWidth: "582px",
          },
        }
      )
    ).toBe(`width="80%"`);
  });

  it("will return % for all columns if groupColumns is true", () => {
    const width = "10%";
    expect(
      compiledHbs(
        {
          size: 2,
          layout: "right",
          groupColumns: true,
          width,
          index: 0,
        },
        {
          data: {
            columns: [{}, {}],
            templateWidth: "582px",
          },
        }
      )
    ).toBe('width="90%"');

    expect(
      compiledHbs(
        {
          size: 2,
          layout: "right",
          groupColumns: true,
          width,
          index: 1,
        },
        {
          data: {
            columns: [{}, {}],
            templateWidth: "582px",
          },
        }
      )
    ).toBe(`width="10%"`);
  });
});
