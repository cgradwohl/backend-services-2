import { customerCreatedHandler } from "./customer-created";
import { customerDeletedHandler } from "./customer-deleted";
import { customerSubscriptionHandler } from "./customer-subscription";
import { customerUpdatedHandler } from "./customer-updated";
import { invoiceFinalizedHandler } from "./invoice-finalized";
import { invoicePaymentHandler } from "./invoice-payment";
import { paymentMethodHandler } from "./payment-method";

export default {
  "customer.created": customerCreatedHandler,
  "customer.deleted": customerDeletedHandler,
  "customer.subscription.created": customerSubscriptionHandler,
  "customer.subscription.deleted": customerSubscriptionHandler,
  "customer.subscription.updated": customerSubscriptionHandler,
  "customer.updated": customerUpdatedHandler,

  "invoice.finalized": invoiceFinalizedHandler,
  "invoice.payment_action_required": invoicePaymentHandler,
  "invoice.payment_failed": invoicePaymentHandler,
  "invoice.payment_succeeded": invoicePaymentHandler,

  "payment_method.attached": paymentMethodHandler,
  "payment_method.card_automatically_updated": paymentMethodHandler,
  "payment_method.detached": paymentMethodHandler,
  "payment_method.updated": paymentMethodHandler,
};
