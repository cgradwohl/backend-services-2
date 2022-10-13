import dotenv from "dotenv";
dotenv.config({ path: "__smoke_tests__/.env" });
import { CourierClient } from "@trycourier/courier";

const JEST_TIMEOUT = 60000;

const courier = CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN,
  baseUrl: process.env.API_URL,
});

describe("brand api", () => {
  let createdBrand;

  test(
    `can create a brand without an id`,
    async () => {
      const potentialBrand = {
        name: "My Brand",
        settings: {
          colors: {
            primary: "#0000FF",
            secondary: "#FF0000",
            tertiary: "#00FF00",
          },
        },
      };

      createdBrand = await courier.createBrand(potentialBrand);
      expect(createdBrand.id).toBeDefined();

      const fetchedBrand = await courier.getBrand(createdBrand.id);
      expect(fetchedBrand.id).toEqual(createdBrand.id);
      expect(fetchedBrand.settings).toEqual(createdBrand.settings);
      expect(fetchedBrand.name).toEqual(createdBrand.name);
    },
    JEST_TIMEOUT
  );

  test(
    `can replace a brand`,
    async () => {
      const changedBrand = {
        name: "New Name",
        settings: {
          colors: {
            primary: "red",
            secondary: "white",
            tertiary: "blue",
          },
        },
      };

      await courier.replaceBrand({
        ...changedBrand,
        id: createdBrand.id,
      });

      const fetchedBrand = await courier.getBrand(createdBrand.id);
      expect(fetchedBrand.id).toEqual(createdBrand.id);
      expect(fetchedBrand.settings.colors).toEqual(
        changedBrand.settings.colors
      );
      expect(fetchedBrand.name).toEqual(changedBrand.name);
    },
    JEST_TIMEOUT
  );

  test(
    `can delete the created brand`,
    async () => {
      await courier.deleteBrand(createdBrand.id);
      const response = await courier.getBrand(createdBrand.id).catch(String);
      expect(response).toEqual("Error: Request failed with status code 404");
    },
    JEST_TIMEOUT
  );
});
