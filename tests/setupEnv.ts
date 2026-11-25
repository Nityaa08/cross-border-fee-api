// The app's per-client limit (30 calculations a minute by default) is meant
// for the public demo. The API tests make more calls than that from one
// client in under a minute, so give them room; the limiter itself is tested
// on its own in demo.test.ts.
process.env.RATE_LIMIT_PER_MINUTE ??= "1000";
