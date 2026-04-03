// Set fake Braintree credentials so the gateway initializes without throwing.
// These are only used for health check tests; no real Braintree calls are made.
process.env.BRAINTREE_MERCHANT_ID = "health_check_merchant";
process.env.BRAINTREE_PUBLIC_KEY = "health_check_public_key";
process.env.BRAINTREE_PRIVATE_KEY = "health_check_private_key";
