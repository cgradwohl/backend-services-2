import uuid from "uuid";
import * as apiKeyUtils from "~/lib/api-key-uuid";
import * as preferences from "~/lib/preferences";
import { INotificationWire, NotificationCategory } from "~/types.api";
import { IProfilePreferences } from "~/types.public";

const requiredNotification = {
  id: "mockNotificationId",
  json: {
    blocks: [],
    channels: {
      always: [],
      bestOf: [],
    },
    config: {
      type: preferences.NOTIFICATION_TYPES.REQUIRED,
    },
  },
};

const requiredCategory = {
  id: "mockCategoryId",
  json: {
    notificationConfig: {
      type: preferences.NOTIFICATION_TYPES.REQUIRED,
    },
  },
};

const optInCategory = {
  id: "mockCategoryId",
  json: {
    notificationConfig: {
      type: preferences.NOTIFICATION_TYPES.OPT_IN,
    },
  },
  title: "Mock Category",
};

const optOutCategory = {
  id: "mockCategoryId",
  json: {
    notificationConfig: {
      type: preferences.NOTIFICATION_TYPES.OPT_OUT,
    },
  },
  title: "Mock Category",
};

const optOutNotification = {
  id: "mockNotificationId",
  json: {
    blocks: [],
    categoryId: undefined,
    channels: {
      always: [],
      bestOf: [],
    },
    config: {
      type: preferences.NOTIFICATION_TYPES.OPT_OUT,
    },
  },
};

const optInNotification = {
  id: "mockNotificationId",
  json: {
    blocks: [],
    categoryId: undefined,
    channels: {
      always: [],
      bestOf: [],
    },
    config: {
      type: preferences.NOTIFICATION_TYPES.OPT_IN,
    },
  },
};

describe("if preferences store the API Key for ID", () => {
  const categoryId = uuid.v4();
  const category: NotificationCategory = {
    created: 1241412412412,
    creator: "mwa",
    id: categoryId,
    json: {
      notificationConfig: {
        type: preferences.NOTIFICATION_TYPES.OPT_IN,
      },
    },
    objtype: "categories",
    tenantId: "lalalala",
    title: "Mock Category",
  };

  it("will be able to do the lookup against Category's API Key", () => {
    const pref: IProfilePreferences = {
      categories: {
        [apiKeyUtils.toApiKey(categoryId)]: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
      notifications: {},
    };

    expect(
      preferences.getUserPreference({
        category,
        notification: {},
        preferences: pref,
      })
    ).toEqual({
      message: "Category, Mock Category, opted out by user",
      reason: "UNSUBSCRIBED",
    });
  });

  const notificationId = uuid.v4();
  const notification: Partial<INotificationWire> = {
    id: notificationId,
    json: {
      blocks: [],
      categoryId: undefined,
      channels: {
        always: [],
        bestOf: [],
      },
      config: {
        type: preferences.NOTIFICATION_TYPES.OPT_IN,
      },
    },
    title: "Mock Notification",
  };

  it("will be able to do the lookup against Notification's API Key", () => {
    const pref: IProfilePreferences = {
      categories: {},
      notifications: {
        [apiKeyUtils.toApiKey(notificationId)]: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
    };

    expect(
      preferences.getUserPreference({
        category: {},
        notification,
        preferences: pref,
      })
    ).toEqual({
      message: "Notification opted out by user",
      reason: "UNSUBSCRIBED",
    });
  });

  it("will call toApiKey with exepected values", () => {
    const pref = {
      categories: {
        [apiKeyUtils.toApiKey(categoryId)]: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
      notifications: {},
    };
    const spy = jest.spyOn(apiKeyUtils, "toApiKey");

    preferences.getUserPreference({
      category,
      notification,
      preferences: pref,
    });

    expect(spy.mock.calls.length).toBe(2);
    expect(spy.mock.calls[0][0]).toBe(apiKeyUtils.toApiKey(categoryId));
  });

  it("will check existing ids to match against APIKey format", () => {
    const pref: IProfilePreferences = {
      categories: null,
      notifications: {
        "b6f6cda4-e5af-4055-b710-6ab6ff7369f0": {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
    };

    const optedOutNotification = {
      id: "b6f6cda4-e5af-4055-b710-6ab6ff7369f0",
      json: {
        blocks: [],
        categoryId: undefined,
        channels: {
          always: [],
          bestOf: [],
        },
        config: {
          type: preferences.NOTIFICATION_TYPES.OPT_OUT,
        },
      },
    };
    const userPreference = preferences.getUserPreference({
      category: null,
      notification: optedOutNotification,
      preferences: pref,
    });
    const expectedPreferences = {
      message: `Notification opted out by user`,
      reason: "UNSUBSCRIBED",
    };

    expect(userPreference).not.toBeUndefined();
    expect(userPreference).toEqual(expectedPreferences);
  });
});

it("will ignore user prefs if notification is required", () => {
  const result = preferences.getUserPreference({
    category: {},
    notification: requiredNotification,
    preferences: {
      categories: {},
      notifications: {
        mockNotificationId: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
    },
  });

  expect(result).toBe(undefined);
});

it("will require a notification at category level, if disabled", () => {
  const result = preferences.getUserPreference({
    category: requiredCategory,
    notification: optOutNotification,
    preferences: {
      categories: {
        mockCategoryId: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
      notifications: {
        mockNotificationId: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
    },
  });

  expect(result).toBe(undefined);
});

it("will allow disabling at notification level", () => {
  const result = preferences.getUserPreference({
    category: {},
    notification: optOutNotification,
    preferences: {
      categories: {},
      notifications: {
        mockNotificationId: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
    },
  });

  expect(result).toEqual({
    message: "Notification opted out by user",
    reason: "UNSUBSCRIBED",
  });
});

it("will allow disabling at category level", () => {
  const result = preferences.getUserPreference({
    category: optOutCategory,
    notification: {
      id: "mockNotificationId",
      json: {
        blocks: [],
        channels: {
          always: [],
          bestOf: [],
        },
        config: {
          type: preferences.NOTIFICATION_TYPES.OPT_OUT,
        },
      },
    },
    preferences: {
      categories: {
        mockCategoryId: {
          status: preferences.PREFERENCE_STATUS.OPTED_OUT,
        },
      },
      notifications: {},
    },
  });

  expect(result).toEqual({
    message: "Category, Mock Category, opted out by user",
    reason: "UNSUBSCRIBED",
  });
});

describe("optIn", () => {
  describe("no category, opt-in notification", () => {
    it("should prevent sending if no preferences are set", () => {
      const result = preferences.getUserPreference({
        category: undefined,
        notification: optInNotification,
        preferences: {
          categories: {},
          notifications: {},
        },
      });

      expect(result).toEqual({
        message: "Notification requires explicit opt in",
        reason: "OPT_IN_REQUIRED",
      });
    });

    it("should allow sending if opted-in", () => {
      const result = preferences.getUserPreference({
        category: undefined,
        notification: optInNotification,
        preferences: {
          categories: {},
          notifications: {
            mockNotificationId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
        },
      });

      expect(result).toBe(undefined);
    });
  });

  describe("opt in category, opt out notification", () => {
    it("should prevent sending without preferences", () => {
      const result = preferences.getUserPreference({
        category: optInCategory,
        notification: optOutNotification,
        preferences: {
          categories: {},
          notifications: {},
        },
      });

      expect(result).toEqual({
        message: "Category, Mock Category, requires explicit opt in",
        reason: "OPT_IN_REQUIRED",
      });
    });

    it("should prevent sending if notification is opt in and category preference is not set", () => {
      const result = preferences.getUserPreference({
        category: optInCategory,
        notification: optOutNotification,
        preferences: {
          categories: {},
          notifications: {
            mockNotificationId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
        },
      });

      expect(result).toEqual({
        message: "Category, Mock Category, requires explicit opt in",
        reason: "OPT_IN_REQUIRED",
      });
    });

    it("should allow sending if category is opted in", () => {
      const result = preferences.getUserPreference({
        category: optInCategory,
        notification: optOutNotification,
        preferences: {
          categories: {
            mockCategoryId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
          notifications: {},
        },
      });

      expect(result).toEqual(undefined);
    });

    it("should allow user to opt-out at the notification level", () => {
      const result = preferences.getUserPreference({
        category: optInCategory,
        notification: optOutNotification,
        preferences: {
          categories: {
            mockCategoryId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
          notifications: {
            mockNotificationId: {
              status: preferences.PREFERENCE_STATUS.OPTED_OUT,
            },
          },
        },
      });

      expect(result).toEqual({
        message: "Notification opted out by user",
        reason: "UNSUBSCRIBED",
      });
    });
  });

  describe("opt in category, opt in notification", () => {
    it("should prevent sending if notification is opted out while category is opted in", () => {
      const result = preferences.getUserPreference({
        category: optInCategory,
        notification: optInNotification,
        preferences: {
          categories: {
            mockCategoryId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
          notifications: {
            mockNotificationId: {
              status: preferences.PREFERENCE_STATUS.OPTED_OUT,
            },
          },
        },
      });

      expect(result).toEqual({
        message: "Notification opted out by user",
        reason: "UNSUBSCRIBED",
      });
    });

    it("should prevent sending if notification is opted in while category is opted out", () => {
      const result = preferences.getUserPreference({
        category: optInCategory,
        notification: optInNotification,
        preferences: {
          categories: {
            mockCategoryId: {
              status: preferences.PREFERENCE_STATUS.OPTED_OUT,
            },
          },
          notifications: {
            mockNotificationId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
        },
      });

      expect(result).toEqual({
        message: "Category, Mock Category, opted out by user",
        reason: "UNSUBSCRIBED",
      });
    });

    it("should send if both category and notification are opted into", () => {
      const result = preferences.getUserPreference({
        category: optInCategory,
        notification: optInNotification,
        preferences: {
          categories: {
            mockCategoryId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
          notifications: {
            mockNotificationId: {
              status: preferences.PREFERENCE_STATUS.OPTED_IN,
            },
          },
        },
      });

      expect(result).toEqual(undefined);
    });
  });
});
