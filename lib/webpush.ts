import webpush from 'web-push'

let initialized = false

function getWebPush() {
  if (!initialized) {
    webpush.setVapidDetails(
      'mailto:support@habichalle.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )
    initialized = true
  }
  return webpush
}

export { getWebPush }
