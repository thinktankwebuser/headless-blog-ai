<?php
/**
 * WordPress Configuration Additions for Next.js Blog Sync
 *
 * Add these lines to your wp-config.php file
 * Place them BEFORE the "That's all, stop editing!" line
 */

// Next.js Blog Sync Configuration
define('NEXTJS_SYNC_URL', 'https://first-project-pzep5ru7m-austins-projects-5c6378fa.vercel.app/api/blog-sync');
define('NEXTJS_WEBHOOK_SECRET', '518e7fddae21242135b37dbba53cf92b3834cbf5a7f149a7e3f6ebfc705d761f');

// Optional: Enable WordPress debug logging for troubleshooting
// Only enable these in development/staging environments
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

/**
 * Security Notes:
 *
 * 1. Replace 'your-secure-random-string-here-min-32-chars' with a strong random string
 *    Generate one at: https://1password.com/password-generator/
 *
 * 2. Replace 'https://yoursite.com' with your actual Next.js domain
 *
 * 3. Use HTTPS in production for secure webhook communication
 *
 * 4. Keep your webhook secret private - don't commit it to version control
 */