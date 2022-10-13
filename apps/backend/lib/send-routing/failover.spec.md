# Failover

Requirements:

- Respects provider, channel, and message level timeouts
- Goes through each provider configured for a channel
- Will failover across channels and providers specified in a "single" method routing strategy

# Failing Over

When rendering or sending directly with a provider fails do one of two things:

1. If the error can be retried retry that step until the provider times out or max retries are reached.
2. If the error is unrecoverable, begin failover immediately

Once either of those conditions are met, begin the failover. To failover, re-trigger the route
function and include both the current address and send times in the re-trigger payload.

When the router is called with a failedAddress, call `getFailoverRouteNodeAddress`. This function
will traverse return the correct failover node that you can then use to re-dispatch routes from

# Fred - A Failover Scenario We Don't Handle Yet

Fred is a scenario that the current failover strategy cannot handle. Fred occurs when two or
more concurrent sends must fail before we can failover.

Take the following routing example.

```ts
routing = {
  method: "single"
  channels: [
    {
      method: "all",
      channels: ["apn", "firebase"]
    },
    "sms"
  ]
}
```

In this scenario we can only failover to `"sms"` when sends to _both_ `"apn"` and `"firebase"`
fails.

To properly handle this scenario we must check the delivery sibling routes before failing over.

# Examples

Configured Providers

- Email
  - SES
  - Sendgrid
  - Mailjet
- SMS
  - Twilio
  - Vonage

## Example 1

```ts
const message = {
  routing:{
    method: "single"
    channels: ["sms", "email"]
  },
  timeouts: {
    message: 50000,
    channel: 15000,
    provider: 5000,
  }
}
```

Background:
We make a send with the above routing. Twilio and Vonage both happen to be down

Expected Steps:

- Attempt Twilio a few times
- Timeout Twilio after 5000ms
- Attempt Vonage a few times
- Timeout Vonage after 5000ms
- Successful send via SES

## Example 2

```ts
const message = {
  routing:{
    method: "single"
    channels: [
      "sms",
      {
        method: "all",
        channels: ["apn", "firebase"]
      }
    ]
  },
  timeouts: {
    message: 50000,
    channel: 15000,
    provider: 5000,
  }
}
```

Background:
We make a send with the above routing. Twilio and Vonage both happen to be down

Expected Steps:

- Attempt Twilio a few times
- Timeout Twilio after 5000ms
- Attempt Vonage a few times
- Timeout Twilio after 5000ms
- Successful send via APN and Firebase

## Example 3 (A Fred Scenario) - The tough one we don't handle yet

```ts
const message = {
  routing: {
    method: "single"
    channels: [
      {
        method: "all",
        channels: ["apn", "firebase"]
      },
      "sms"
    ]
  },
  timeouts: {
    message: 50000,
    channel: 15000,
    provider: 5000,
  }
}
```

Background:
We make a send with the above routing. APN and Firebase both happen to be down

Expected Steps:

- Attempt APN a few times
- Attempt Firebase a few times
- If sending with _both_ apn and firebase fails, move onto sms
