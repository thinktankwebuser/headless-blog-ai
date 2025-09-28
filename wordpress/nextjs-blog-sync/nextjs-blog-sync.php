<?php
/**
 * Plugin Name: Next.js Blog Sync
 * Plugin URI: https://github.com/yourrepo/nextjs-blog-sync
 * Description: Syncs WordPress blog posts with Next.js Supabase search via webhooks
 * Version: 1.0.0
 * Author: Your Name
 * License: MIT
 * Text Domain: nextjs-blog-sync
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class NextJsBlogSync {

    private $webhook_url;
    private $webhook_secret;

    public function __construct() {
        $this->webhook_url = defined('NEXTJS_SYNC_URL') ? NEXTJS_SYNC_URL : '';
        $this->webhook_secret = defined('NEXTJS_WEBHOOK_SECRET') ? NEXTJS_WEBHOOK_SECRET : '';

        // Initialize hooks
        add_action('init', [$this, 'init']);
        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('admin_init', [$this, 'admin_init']);

        // Post lifecycle hooks
        add_action('publish_post', [$this, 'handle_post_published'], 10, 2);
        add_action('post_updated', [$this, 'handle_post_updated'], 10, 3);
        add_action('before_delete_post', [$this, 'handle_post_deleted'], 10, 2);
        add_action('wp_trash_post', [$this, 'handle_post_trashed']);
        add_action('untrash_post', [$this, 'handle_post_untrashed']);

        // Status transition hooks for better coverage
        add_action('transition_post_status', [$this, 'handle_status_transition'], 10, 3);
    }

    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('nextjs-blog-sync', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    /**
     * Handle post published
     */
    public function handle_post_published($post_id, $post) {
        if ($post->post_type !== 'post') return;

        $this->send_webhook_notification([
            'action' => 'published',
            'wp_post_id' => $post_id,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'timestamp' => current_time('timestamp'),
            'post_data' => $this->get_post_data($post_id)
        ]);

        $this->log_event("Post published: {$post->post_title} (ID: {$post_id})");
    }

    /**
     * Handle post updated
     */
    public function handle_post_updated($post_id, $post_after, $post_before) {
        if ($post_after->post_type !== 'post') return;

        // Only sync if content actually changed
        if ($this->has_content_changed($post_before, $post_after)) {
            $this->send_webhook_notification([
                'action' => 'updated',
                'wp_post_id' => $post_id,
                'slug' => $post_after->post_name,
                'status' => $post_after->post_status,
                'timestamp' => current_time('timestamp'),
                'post_data' => $this->get_post_data($post_id)
            ]);

            $this->log_event("Post updated: {$post_after->post_title} (ID: {$post_id})");
        }
    }

    /**
     * Handle post deleted
     */
    public function handle_post_deleted($post_id, $post) {
        if (!$post || $post->post_type !== 'post') return;

        $this->send_webhook_notification([
            'action' => 'deleted',
            'wp_post_id' => $post_id,
            'slug' => $post->post_name,
            'timestamp' => current_time('timestamp')
        ]);

        $this->log_event("Post deleted: {$post->post_title} (ID: {$post_id})");
    }

    /**
     * Handle post trashed
     */
    public function handle_post_trashed($post_id) {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'post') return;

        $this->send_webhook_notification([
            'action' => 'trashed',
            'wp_post_id' => $post_id,
            'slug' => $post->post_name,
            'timestamp' => current_time('timestamp')
        ]);

        $this->log_event("Post trashed: {$post->post_title} (ID: {$post_id})");
    }

    /**
     * Handle post untrashed
     */
    public function handle_post_untrashed($post_id) {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'post') return;

        $this->send_webhook_notification([
            'action' => 'untrashed',
            'wp_post_id' => $post_id,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'timestamp' => current_time('timestamp'),
            'post_data' => $this->get_post_data($post_id)
        ]);

        $this->log_event("Post untrashed: {$post->post_title} (ID: {$post_id})");
    }

    /**
     * Handle status transitions (draft -> publish, etc.)
     */
    public function handle_status_transition($new_status, $old_status, $post) {
        if ($post->post_type !== 'post') return;
        if ($new_status === $old_status) return;

        $action = 'status_changed';

        // Specific actions for important transitions
        if ($old_status !== 'publish' && $new_status === 'publish') {
            $action = 'published';
        } elseif ($old_status === 'publish' && $new_status !== 'publish') {
            $action = 'unpublished';
        }

        $this->send_webhook_notification([
            'action' => $action,
            'wp_post_id' => $post->ID,
            'slug' => $post->post_name,
            'old_status' => $old_status,
            'new_status' => $new_status,
            'timestamp' => current_time('timestamp'),
            'post_data' => ($new_status === 'publish') ? $this->get_post_data($post->ID) : null
        ]);

        $this->log_event("Post status changed: {$post->post_title} (ID: {$post->ID}) from {$old_status} to {$new_status}");
    }

    /**
     * Check if post content has meaningfully changed
     */
    private function has_content_changed($post_before, $post_after) {
        $fields_to_check = ['post_title', 'post_content', 'post_excerpt', 'post_status'];

        foreach ($fields_to_check as $field) {
            if ($post_before->$field !== $post_after->$field) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get formatted post data for Next.js
     */
    private function get_post_data($post_id) {
        $post = get_post($post_id);
        if (!$post) return null;

        return [
            'id' => $post->ID,
            'slug' => $post->post_name,
            'title' => [
                'rendered' => get_the_title($post_id)
            ],
            'content' => [
                'rendered' => apply_filters('the_content', $post->post_content)
            ],
            'excerpt' => [
                'rendered' => get_the_excerpt($post_id)
            ],
            'status' => $post->post_status,
            'date' => $post->post_date,
            'date_gmt' => $post->post_date_gmt,
            'modified' => $post->post_modified,
            'modified_gmt' => $post->post_modified_gmt,
            'featured_media' => get_post_thumbnail_id($post_id),
            'categories' => wp_get_post_categories($post_id),
            'tags' => wp_get_post_tags($post_id, ['fields' => 'ids'])
        ];
    }

    /**
     * Send webhook notification to Next.js
     */
    private function send_webhook_notification($payload) {
        if (empty($this->webhook_url)) {
            $this->log_event("Webhook URL not configured", 'warning');
            return false;
        }

        // Add signature for security
        $payload['signature'] = $this->generate_signature($payload);

        $args = [
            'body' => json_encode($payload),
            'headers' => [
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress/' . get_bloginfo('version') . ' NextJS-Blog-Sync/1.0.0'
            ],
            'timeout' => 15,
            'blocking' => false, // Non-blocking request
            'data_format' => 'body'
        ];

        $response = wp_remote_post($this->webhook_url, $args);

        if (is_wp_error($response)) {
            $this->log_event("Webhook failed: " . $response->get_error_message(), 'error');
            return false;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code >= 200 && $response_code < 300) {
            $this->log_event("Webhook sent successfully (HTTP {$response_code})");
            return true;
        } else {
            $this->log_event("Webhook failed with HTTP {$response_code}", 'error');
            return false;
        }
    }

    /**
     * Generate HMAC signature for webhook security
     */
    private function generate_signature($payload) {
        if (empty($this->webhook_secret)) return '';

        $data_to_sign = $payload['wp_post_id'] . $payload['timestamp'];
        return hash_hmac('sha256', $data_to_sign, $this->webhook_secret);
    }

    /**
     * Log events for debugging
     */
    private function log_event($message, $level = 'info') {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("[NextJS Blog Sync] [{$level}] {$message}");
        }

        // Store in option for admin display
        $logs = get_option('nextjs_blog_sync_logs', []);
        array_unshift($logs, [
            'timestamp' => current_time('mysql'),
            'level' => $level,
            'message' => $message
        ]);

        // Keep only last 50 logs
        $logs = array_slice($logs, 0, 50);
        update_option('nextjs_blog_sync_logs', $logs);
    }

    /**
     * Admin menu
     */
    public function admin_menu() {
        add_options_page(
            __('Next.js Blog Sync', 'nextjs-blog-sync'),
            __('Blog Sync', 'nextjs-blog-sync'),
            'manage_options',
            'nextjs-blog-sync',
            [$this, 'admin_page']
        );
    }

    /**
     * Admin settings init
     */
    public function admin_init() {
        register_setting('nextjs_blog_sync', 'nextjs_sync_url');
        register_setting('nextjs_blog_sync', 'nextjs_webhook_secret');
    }

    /**
     * Admin page
     */
    public function admin_page() {
        if (isset($_POST['test_webhook'])) {
            $this->test_webhook();
        }

        $logs = get_option('nextjs_blog_sync_logs', []);
        ?>
        <div class="wrap">
            <h1><?php _e('Next.js Blog Sync Settings', 'nextjs-blog-sync'); ?></h1>

            <form method="post" action="options.php">
                <?php
                settings_fields('nextjs_blog_sync');
                do_settings_sections('nextjs_blog_sync');
                ?>

                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Webhook URL', 'nextjs-blog-sync'); ?></th>
                        <td>
                            <input type="url" name="nextjs_sync_url" value="<?php echo esc_attr(get_option('nextjs_sync_url', $this->webhook_url)); ?>" class="regular-text" />
                            <p class="description"><?php _e('Your Next.js API endpoint (e.g., https://yoursite.com/api/blog-sync)', 'nextjs-blog-sync'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Webhook Secret', 'nextjs-blog-sync'); ?></th>
                        <td>
                            <input type="password" name="nextjs_webhook_secret" value="<?php echo esc_attr(get_option('nextjs_webhook_secret', $this->webhook_secret)); ?>" class="regular-text" />
                            <p class="description"><?php _e('Secure secret for webhook verification', 'nextjs-blog-sync'); ?></p>
                        </td>
                    </tr>
                </table>

                <?php submit_button(); ?>
            </form>

            <hr>

            <h2><?php _e('Test Webhook', 'nextjs-blog-sync'); ?></h2>
            <form method="post">
                <input type="hidden" name="test_webhook" value="1">
                <?php submit_button(__('Send Test Webhook', 'nextjs-blog-sync'), 'secondary'); ?>
            </form>

            <hr>

            <h2><?php _e('Recent Activity', 'nextjs-blog-sync'); ?></h2>
            <?php if (empty($logs)): ?>
                <p><?php _e('No activity logged yet.', 'nextjs-blog-sync'); ?></p>
            <?php else: ?>
                <table class="wp-list-table widefat striped">
                    <thead>
                        <tr>
                            <th><?php _e('Time', 'nextjs-blog-sync'); ?></th>
                            <th><?php _e('Level', 'nextjs-blog-sync'); ?></th>
                            <th><?php _e('Message', 'nextjs-blog-sync'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_slice($logs, 0, 20) as $log): ?>
                            <tr>
                                <td><?php echo esc_html($log['timestamp']); ?></td>
                                <td><span class="log-level log-<?php echo esc_attr($log['level']); ?>"><?php echo esc_html($log['level']); ?></span></td>
                                <td><?php echo esc_html($log['message']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <style>
        .log-level { padding: 2px 6px; border-radius: 3px; font-size: 11px; }
        .log-info { background: #d1ecf1; color: #0c5460; }
        .log-warning { background: #fff3cd; color: #856404; }
        .log-error { background: #f8d7da; color: #721c24; }
        </style>
        <?php
    }

    /**
     * Test webhook functionality
     */
    private function test_webhook() {
        $result = $this->send_webhook_notification([
            'action' => 'test',
            'wp_post_id' => 0,
            'slug' => 'test-webhook',
            'timestamp' => current_time('timestamp'),
            'message' => 'Test webhook from WordPress admin'
        ]);

        if ($result) {
            echo '<div class="notice notice-success"><p>' . __('Test webhook sent successfully!', 'nextjs-blog-sync') . '</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>' . __('Test webhook failed. Check the logs below.', 'nextjs-blog-sync') . '</p></div>';
        }
    }
}

// Initialize the plugin
new NextJsBlogSync();