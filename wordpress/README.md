# WordPress Configuration for Blog Search

Phase 2: WordPress webhook setup to sync posts with Next.js Supabase search.

## Installation

### Option 1: WordPress Plugin (Recommended)

1. **Upload Plugin**
   ```bash
   # Upload the nextjs-blog-sync folder to your WordPress plugins directory
   wp-content/plugins/nextjs-blog-sync/
   ```

2. **Configure WordPress**

   Add these lines to your `wp-config.php` file **before** `/* That's all, stop editing! */`:

   ```php
   // Next.js Blog Sync Configuration
   define('NEXTJS_SYNC_URL', 'https://yoursite.com/api/blog-sync');
   define('NEXTJS_WEBHOOK_SECRET', 'your-secure-random-string-here-min-32-chars');

   // Optional: Enable debug logging (development only)
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   ```

3. **Activate Plugin**
   - Go to WordPress Admin → Plugins
   - Find "Next.js Blog Sync" and click "Activate"
   - Go to Settings → Blog Sync to configure

4. **Configure Settings**
   - **Webhook URL**: `https://yoursite.com/api/blog-sync`
   - **Webhook Secret**: Your secure random string (32+ characters)
   - Click "Save Changes"
   - Use "Send Test Webhook" to verify connection

### Option 2: Functions.php Method

If you prefer not to use a plugin, add this to your theme's `functions.php`:

```php
// Simple webhook implementation
add_action('publish_post', 'notify_nextjs_post_change');
add_action('post_updated', 'notify_nextjs_post_change');
add_action('before_delete_post', 'notify_nextjs_post_deleted');

function notify_nextjs_post_change($post_id) {
    $post = get_post($post_id);
    if ($post->post_type !== 'post') return;

    $webhook_url = defined('NEXTJS_SYNC_URL') ? NEXTJS_SYNC_URL : '';
    $webhook_secret = defined('NEXTJS_WEBHOOK_SECRET') ? NEXTJS_WEBHOOK_SECRET : '';

    if (empty($webhook_url)) return;

    $payload = [
        'action' => $post->post_status === 'publish' ? 'published' : 'updated',
        'wp_post_id' => $post_id,
        'slug' => $post->post_name,
        'timestamp' => current_time('timestamp'),
        'signature' => hash_hmac('sha256', $post_id . current_time('timestamp'), $webhook_secret)
    ];

    wp_remote_post($webhook_url, [
        'body' => json_encode($payload),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 15,
        'blocking' => false
    ]);
}

function notify_nextjs_post_deleted($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post') return;

    $webhook_url = defined('NEXTJS_SYNC_URL') ? NEXTJS_SYNC_URL : '';
    $webhook_secret = defined('NEXTJS_WEBHOOK_SECRET') ? NEXTJS_WEBHOOK_SECRET : '';

    if (empty($webhook_url)) return;

    $payload = [
        'action' => 'deleted',
        'wp_post_id' => $post_id,
        'timestamp' => current_time('timestamp'),
        'signature' => hash_hmac('sha256', $post_id . current_time('timestamp'), $webhook_secret)
    ];

    wp_remote_post($webhook_url, [
        'body' => json_encode($payload),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 15,
        'blocking' => false
    ]);
}
```

## Security Configuration

### 1. Generate Secure Webhook Secret

Use a strong random string (32+ characters):

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Environment Variables

For additional security, use environment variables instead of hardcoded values:

```php
// In wp-config.php
define('NEXTJS_SYNC_URL', $_ENV['NEXTJS_SYNC_URL'] ?? 'https://yoursite.com/api/blog-sync');
define('NEXTJS_WEBHOOK_SECRET', $_ENV['NEXTJS_WEBHOOK_SECRET'] ?? '');
```

### 3. HTTPS Only

Always use HTTPS for webhook URLs in production to prevent man-in-the-middle attacks.

## Webhook Events

The plugin sends webhooks for these WordPress events:

### Post Events
- **published** - Post published for the first time
- **updated** - Existing post content changed
- **deleted** - Post permanently deleted
- **trashed** - Post moved to trash
- **untrashed** - Post restored from trash
- **unpublished** - Published post changed to draft/private
- **status_changed** - Any other status transition

### Webhook Payload Structure

```json
{
  "action": "published",
  "wp_post_id": 123,
  "slug": "my-blog-post",
  "status": "publish",
  "timestamp": 1640995200,
  "signature": "hmac_sha256_signature",
  "post_data": {
    "id": 123,
    "title": {"rendered": "My Blog Post"},
    "content": {"rendered": "<p>Post content...</p>"},
    "excerpt": {"rendered": "Post excerpt..."},
    "date": "2021-12-31T12:00:00",
    "modified": "2021-12-31T12:30:00",
    "categories": [1, 5],
    "tags": [10, 15, 20]
  }
}
```

## Troubleshooting

### Check Webhook Logs

1. **Plugin Method**: Go to Settings → Blog Sync → Recent Activity
2. **Debug Logs**: Check WordPress debug logs in `/wp-content/debug.log`
3. **Server Logs**: Check your web server error logs

### Common Issues

**Webhooks not sending:**
- Verify `NEXTJS_SYNC_URL` is configured correctly
- Check that WordPress can make outbound HTTP requests
- Ensure no firewall is blocking outbound connections

**Authentication errors:**
- Verify `NEXTJS_WEBHOOK_SECRET` matches between WordPress and Next.js
- Check that signature generation is working correctly

**Timeouts:**
- Next.js webhook endpoint is taking too long to respond (>15 seconds)
- Consider making webhook processing asynchronous

### Testing Webhooks

Use the plugin's "Send Test Webhook" feature or manually trigger events:

```php
// Manually trigger a webhook (for testing)
do_action('publish_post', $post_id, get_post($post_id));
```

## Performance Considerations

### Non-blocking Requests

The plugin uses `'blocking' => false` for webhook requests to prevent WordPress slowdown.

### Rate Limiting

WordPress automatically handles rapid-fire events through its action system, but consider implementing rate limiting on the Next.js side.

### Error Handling

Failed webhooks are logged but don't prevent WordPress operations from completing.

## Next Steps

After WordPress configuration:

1. **Phase 3**: Implement Next.js webhook handler
2. **Phase 4**: Create initial data sync script
3. **Phase 5**: Add frontend search interface

## Plugin Features

✅ **Complete WordPress Integration**
- Handles all post lifecycle events
- Secure HMAC signature verification
- Non-blocking webhook requests
- Comprehensive error logging
- Admin interface for configuration
- Test webhook functionality

✅ **Security First**
- HMAC-SHA256 signature verification
- Configurable webhook secrets
- Input sanitization and validation
- No sensitive data in logs

✅ **Production Ready**
- Error handling and recovery
- Performance optimized
- Translatable interface
- WordPress coding standards compliant