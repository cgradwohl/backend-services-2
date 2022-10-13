# Send Integrations (Providers)

## Email

### [AWS SES](https://aws.amazon.com/ses/)

### [Mailgun](https://documentation.mailgun.com/en/latest/api-sending.html#sending)

#### Errors

- `RetryableProviderResponseError`
  - 400 - Bad Request - Often missing a required parameter
  - 401 - Unauthorized - No valid API key provided
  - 402 - Request Failed - Parameters were valid but request failed
  - 500, 502, 503, 504 - Server Errors - something is wrong on Mailgun’s end
- `ProviderResponseError`
  - 404 - Not Found - The requested item doesn’t exist
  - 413 - Request Entity Too Large - Attachment size is too big

### [Mailjet]()

### [Mandrill (MailChimp Transactional)]()

### [OneSignal Email]()

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [Postmark](https://postmarkapp.com/developer/user-guide/send-email-with-api/send-a-single-email)

- `RetryableProviderResponseError`
  - 404 - `PostmarkError` - depends on the code
  - 429 - `UnknownError`
  - 500 - `InternalServerError`
  - 503 - `ServiceUnavailablerError`
- `ProviderResponseError`
  - 401 - `InvalidAPIKeyError`
  - 404 - `PostmarkError` - depends on the code
  - 422 - `ApiInputError`

### [SendGrid](https://sendgrid.com/docs/API_Reference/api_v3.html)

#### Required Profile properties

- `email`

#### Errors

- `RetryableProviderResponseError`
  - 400 - Bad Request
  - 401 - Invalid API Key
  - 403 - Invalid permission on send
  - 406 - Missing Accept header
  - 415 - Your payload must be encoded in UTF-8. This includes any attachments.
  - 429 - Too many requests/Rate limit exceeded
- `ProviderResponseError`
  - 413 - Request too Large

### [SMTP]()

### [SparkPost]()

## Direct Message

### [Facebook Messenger](https://developers.facebook.com/docs/messenger-platform/reference/send-api)

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [Firebase FCM]()

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [Intercom]()

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [MS Teams]()

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [OneSignal]()

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [Slack](https://api.slack.com/web)

#### [Errors](https://slack.dev/node-slack-sdk/web-api#handle-errors)

- `RetryableProviderResponseError`
  - `RateLimitedError`
  - `RequestError`
  - `HTTPError`
- `ProviderResponseError`
  - `PlatformError`
    - `channel_not_found`
    - `user_not_found`

### [Twilio for WhatsApp](https://www.twilio.com/whatsapp)

## Push

### [Airship](https://docs.airship.com/platform/android/push-notifications/)

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [Expo](https://docs.expo.io/push-notifications/overview/)

### [PagerDuty](https://developer.pagerduty.com/api-reference/reference/REST/openapiv3.json/paths/~1change_events/post)

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [Opsgenie](https://docs.opsgenie.com/docs/alert-api)

#### Required Profile properties

- `message`

### [Pushbullet](https://docs.pushbullet.com/#create-push)

## SMS

### [Africa's Talking](https://africastalking.com/sms)

### [MessageBird SMS](https://developers.messagebird.com/quickstarts/sms/send-sms-curl/)

### [Message Media SMS](https://messagemedia.github.io/documentation/#operation/SendMessages)

- `phone_number`

### [Vonage (Previously called Nexmo)](https://developer.nexmo.com/documentation)

### [Plivo](https://dev.bandwidth.com/messaging/methods/messages/createMessage.html)

#### Required Profile properties

- `phone_number`

### [Telnyx](https://developers.telnyx.com/docs/v2/messaging/quickstarts/sending-sms-and-mms)

- `phone_number`

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

### [Sinch](https://developers.sinch.com/docs/sms-guide)

### [Twilio](https://www.twilio.com/docs/sms/api)

#### Required Profile properties

- `phone_number`

#### [Errors](https://www.twilio.com/docs/usage/requests-to-twilio#status-codes)

- `RetryableProviderResponseError`
  - 400 - Depends on code
  - 429 - Too many Requests
  - 500 - Server Error
  - 503 - Service Unavailable
- `ProviderResponseError`
  - 400 - Depends on code
  - 401 - Unauthorized
  - 404 - Not Found
  - 405 - Not Allowed

## Webhook

### [Pusher](https://www.pusher.com/docs/sms/api)

#### Required Profile properties

- `pusher.channel`

#### [Errors](https://pusher.com/docs/channels/library_auth_reference/rest-api)

- `RetryableProviderResponseError`
- `ProviderResponseError`
  - 400 Error: details in response body
  - 401 Authentication error: response body will contain an explanation
  - 403 Forbidden: app disabled or over message quota

### Webhooks

#### Errors

- `RetryableProviderResponseError`
  - 403 - Forbidden - Insufficient permission
  - 408 - Timeout - The request timed out
  - 429 - Too Many Requests - too many requests were sent in a short period of time
  - 5xx - Server Errors - Something is wrong on the webhook end
- `ProviderResponseError`
  - 4xx - All other 400 level errors are returned as `ProviderResponseError`

## Logistics

| File                                   | Description                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                             | KV of all the Integrations                                                                                                   |
| `send-handlers.ts`                     | KV of all the Integrations' template send                                                                                    |
| `render-handlers.ts`                   | KV of all the Integrations' template rendering                                                                               |
| `<integration>/index.ts`               | Contains delivery status check supporting functions, handler for checking if we can execute integration's send, and taxonomy |
| `<integration>/route-handler.ts`       | Contains template rendering fn                                                                                               |
| `<integration>/send.ts`                | Abstraction over Integration's API to perform send of rendered template                                                      |
| `<integration>/get-delivery-status.ts` | Abstraction over Integration's API to check if a sent notification was delivered                                             |

## Errors

### Types

| Type                             | Retryable?         | Internal? | Examples                                |
| -------------------------------- | ------------------ | --------- | --------------------------------------- |
| `ProviderConfigurationError`     | :white_check_mark: |           | Invalid API Key stored in Configuration |
| `ProviderResponseError`          |                    |           | See categorization for each Integration |
| `RetryableProviderResponseError` | :white_check_mark: |           | See categorization for each Integration |
| `EmailParseError`                |                    |           | `support@courier@co`                    |

### Policies

#### Retry Policy

1. The send pipeline will attempt to send a notification.
1. If it encounters an error that is retryable, it will try ten times.
1. If an error occurs, it will try an eleventh time after an hour.
1. If an error occurs, it will try a twelth time after two hours.
1. If an error occurs, it will try a 13th time after three hours. This step will repeat up to 25 times, which will put the attempt in a 72 hour window.
1. If the send doesn't succeed on the 25th attempt, it will go into DLQ.
