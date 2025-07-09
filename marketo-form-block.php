<?php
/**
 * Plugin Name: Marketo Form Block
 * Description: A Gutenberg block for embedding Marketo forms with custom styling options.
 * Version: 1.0.0
 * Author: Volume11
 * Author URI: https://volume11.agency
 * Text Domain: marketo-form-block
 * Domain Path: /languages
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 *
 * @package Marketo_Form_Block
 *
 * Security Measures:
 * - Input Sanitization: All user inputs are sanitized using WordPress sanitization functions
 * - Output Escaping: All outputs are properly escaped to prevent XSS attacks
 * - CSRF Protection: All forms and AJAX requests use WordPress nonces
 * - Capability Checks: All admin actions require appropriate user capabilities
 * - Content Security Policy: Restricts script sources to prevent XSS attacks
 * - Error Handling: Proper error handling to prevent information disclosure
 * - Data Validation: All data is validated before use
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

// Prevent direct file access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define plugin constants
define( 'MARKETO_FORM_BLOCK_VERSION', '1.0.0' );
define( 'MARKETO_FORM_BLOCK_PATH', plugin_dir_path( __FILE__ ) );
define( 'MARKETO_FORM_BLOCK_URL', plugin_dir_url( __FILE__ ) );

// Include required files
require_once MARKETO_FORM_BLOCK_PATH . 'includes/class-marketo-form-block.php';

/**
 * The core plugin class.
 */
class Marketo_Form_Block_Core {

    /**
     * Initialize the plugin.
     */
    public function __construct() {
        // Register hooks
        add_action( 'init', array( $this, 'register_block' ) );
        add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
        
        // Add settings
        add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
        
        // Add security headers
        add_action( 'send_headers', array( $this, 'add_security_headers' ) );
        
        // Add Customizer settings
        add_action( 'customize_register', array( $this, 'register_customizer_settings' ) );
    }
    
    /**
     * Add security headers to prevent XSS and other attacks.
     */
    public function add_security_headers() {
        // Only add these headers on pages with our block
        global $post;
        if ( is_singular() && has_block( 'marketo-form-block/form', $post ) ) {
            // Add Content Security Policy to allow Marketo scripts
            $marketo_instance = sanitize_text_field( get_option( 'marketo_form_block_instance', 'app-ab33.marketo.com' ) );
            header( "Content-Security-Policy: script-src 'self' 'unsafe-inline' https://{$marketo_instance}; frame-src 'self' https://{$marketo_instance};" );
        }
    }

    /**
     * Register the Gutenberg block.
     */
    public function register_block() {
        // Check if Gutenberg is available
        if ( ! function_exists( 'register_block_type' ) ) {
            return;
        }

        // Register the block
        register_block_type( 'marketo-form-block/form', array(
            'editor_script' => 'marketo-form-block-editor',
            'editor_style'  => 'marketo-form-block-editor-style',
            'style'         => 'marketo-form-block-style',
            'render_callback' => array( $this, 'render_marketo_form_block' ),
            'api_version' => 2, // Use the latest API version for better security
            'supports'      => array(
                'color' => array(
                    'background' => true,
                    'text' => true,
                ),
            ),
            'attributes'    => array(
                'formId' => array(
                    'type' => 'string',
                    'default' => '',
                    'description' => __('Marketo Form ID', 'marketo-form-block'),
                ),
                'redirectUrl' => array(
                    'type' => 'string',
                    'default' => '',
                    'description' => __('URL to redirect after successful form submission', 'marketo-form-block'),
                ),
                'successMessage' => array(
                    'type' => 'string',
                    'default' => 'Thank you for your submission!',
                    'description' => __('Message to display after successful form submission', 'marketo-form-block'),
                ),
                'errorMessage' => array(
                    'type' => 'string',
                    'default' => 'There was an error processing your submission. Please try again.',
                    'description' => __('Message to display if form submission fails', 'marketo-form-block'),
                ),
                'customCSS' => array(
                    'type' => 'string',
                    'default' => '',
                    'description' => __('Custom CSS for the form', 'marketo-form-block'),
                ),
                'disableDefaultStyles' => array(
                    'type' => 'boolean',
                    'default' => true,
                    'description' => __('Disable default Marketo styles', 'marketo-form-block'),
                ),
                'accentColor' => array(
                    'type' => 'string',
                ),
            ),
        ) );
    }

    /**
     * Enqueue editor assets.
     */
    public function enqueue_editor_assets() {
        // Enqueue block editor script
        wp_enqueue_script(
            'marketo-form-block-editor',
            MARKETO_FORM_BLOCK_URL . 'build/index.js',
            array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-components' ),
            MARKETO_FORM_BLOCK_VERSION,
            true
        );

        // Enqueue editor styles
        wp_enqueue_style(
            'marketo-form-block-editor-style',
            MARKETO_FORM_BLOCK_URL . 'build/index.css',
            array( 'wp-edit-blocks' ),
            MARKETO_FORM_BLOCK_VERSION
        );
    }

    /**
     * Enqueue frontend assets.
     */
    public function enqueue_frontend_assets() {
        // Enqueue frontend styles
        wp_enqueue_style(
            'marketo-form-block-style',
            MARKETO_FORM_BLOCK_URL . 'build/style-index.css',
            array(),
            MARKETO_FORM_BLOCK_VERSION
        );
        
        // Get Marketo settings
        $marketo_instance = get_option('marketo_form_block_instance', 'app-ab33.marketo.com');
        $marketo_instance = preg_replace('#^https?://#', '', $marketo_instance);
        $marketo_instance = sanitize_text_field($marketo_instance);
        $munchkin_id = sanitize_text_field(get_option('marketo_form_block_munchkin_id', '041-FSQ-281'));
        
        
        // Check if a Marketo form block is present on the page
        global $post;
        $has_marketo_block = false;
        
        if (is_singular() && $post) {
            $has_marketo_block = has_block('marketo-form-block/form', $post);
            
            // Also check for the block in reusable blocks
            if (!$has_marketo_block && has_blocks($post->post_content)) {
                $blocks = parse_blocks($post->post_content);
                $has_marketo_block = $this->check_for_marketo_block_recursive($blocks);
            }
        }
        
        // Only enqueue scripts if a Marketo form block is present
        if ($has_marketo_block) {            
            // Add the Marketo Forms API script to the body (footer)
            add_action('wp_footer', function() use ($marketo_instance, $munchkin_id) {
                // Add Marketo Forms API script
                echo '<script src="https://' . esc_attr($marketo_instance) . '/js/forms2/js/forms2.min.js"></script>';
                // Add Marketo configuration
                echo '<script id="marketo-form-block-config-js-extra" type="text/javascript">';
                echo 'var marketo = {"url":"https://' . esc_js($marketo_instance) . '","api":"' . esc_js($munchkin_id) . '"};';
                echo '</script>';
            }, 5); // High priority (low number) to ensure it loads early in the footer
            
            // Enqueue our frontend script
            wp_enqueue_script(
                'marketo-form-block-frontend',
                MARKETO_FORM_BLOCK_URL . 'build/frontend.js',
                array('jquery'), // Add jQuery as a dependency
                MARKETO_FORM_BLOCK_VERSION,
                true // Our script can still load in the footer
            );
        }
    }
    
    /**
     * Recursively check for Marketo form blocks in nested blocks
     *
     * @param array $blocks Array of blocks
     * @return bool Whether a Marketo form block was found
     */
    private function check_for_marketo_block_recursive($blocks) {
        foreach ($blocks as $block) {
            if ($block['blockName'] === 'marketo-form-block/form') {
                return true;
            }
            
            if (!empty($block['innerBlocks'])) {
                $found = $this->check_for_marketo_block_recursive($block['innerBlocks']);
                if ($found) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Server-side rendering of the Marketo form block.
     *
     * @param array $attributes Block attributes.
     * @return string Block output.
     */
    public function render_marketo_form_block( $attributes, $content, $block ) {
        // Sanitize all block attributes
        $form_id = isset( $attributes['formId'] ) ? sanitize_text_field( $attributes['formId'] ) : '';
        $redirect_url = isset( $attributes['redirectUrl'] ) ? esc_url_raw( $attributes['redirectUrl'] ) : '';
        if ( ! empty( $redirect_url ) && substr( $redirect_url, 0, 1 ) === '/' ) {
            $redirect_url = site_url( $redirect_url );
        }
        $success_message = isset( $attributes['successMessage'] ) ? wp_kses_post( $attributes['successMessage'] ) : '';
        $error_message = isset( $attributes['errorMessage'] ) ? wp_kses_post( $attributes['errorMessage'] ) : '';
        $custom_css = isset( $attributes['customCSS'] ) ? wp_strip_all_tags( $attributes['customCSS'] ) : '';
        $disable_default_styles = isset( $attributes['disableDefaultStyles'] ) ? (bool) $attributes['disableDefaultStyles'] : true;
        
        if ( empty( $form_id ) ) {
            return '<p>' . esc_html__( 'Please specify a Marketo Form ID.', 'marketo-form-block' ) . '</p>';
        }
        
        // Get Marketo settings and sanitize
        $marketo_instance = get_option( 'marketo_form_block_instance', 'app-ab33.marketo.com' );
        // Ensure the instance URL doesn't include https:// already
        $marketo_instance = preg_replace('#^https?://#', '', $marketo_instance);
        $marketo_instance = sanitize_text_field( $marketo_instance );
        $munchkin_id = sanitize_text_field( get_option( 'marketo_form_block_munchkin_id', '041-FSQ-281' ) );
        
        // Generate a unique ID for this form instance
        $form_container_id = 'mkto-form-' . uniqid();
        
        $wrapper_attributes = get_block_wrapper_attributes();

        // Get accent color
        $accent_color_slug = isset( $attributes['accentColor'] ) ? $attributes['accentColor'] : '';
        $accent_color = $this->get_color_value( $accent_color_slug, '#007cba' );
        if ( ! empty( $accent_color ) ) {
            $wrapper_attributes .= ' style="--marketo-accent-color: ' . esc_attr( $accent_color ) . ';"';
        }

        // Start output buffering
        ob_start();
        
        // Global Custom CSS from Customizer
        $global_css = get_theme_mod( 'marketo_form_block_custom_css', '' );
        if ( ! empty( $global_css ) ) {
            echo '<style type="text/css" id="marketo-global-custom-css">' . wp_strip_all_tags( $global_css ) . '</style>';
        }

        // Custom CSS if provided
        if ( ! empty( $custom_css ) ) {
            // Custom CSS should not be escaped with esc_html as it breaks the CSS
            // Instead, we'll use wp_strip_all_tags to remove any potentially harmful HTML
            // Also add a unique ID to prevent CSS conflicts
            echo '<style type="text/css" id="marketo-custom-css-' . esc_attr( $form_container_id ) . '">'
                . wp_strip_all_tags( $custom_css )
                . '</style>';
        }
        
        // On production, use the direct HTML approach with data attributes
        ?>
        <div id="<?php echo esc_attr($form_container_id); ?>" <?php echo $wrapper_attributes; ?>>
            <form
                id="mktoForm_<?php echo esc_attr($form_id); ?>"
                class="mktoForm"
                data-id="<?php echo esc_attr($form_id); ?>"
                <?php if (!empty($redirect_url)) : ?>
                data-confirmation-type="redirect"
                data-link="<?php echo esc_attr($redirect_url); ?>"
                <?php else : ?>
                data-confirmation-type="message"
                <?php endif; ?>>
            </form>
            <div id="mktoFormSuccess-<?php echo esc_attr($form_container_id); ?>" class="marketo-form-success" style="display: none;">
                <?php echo esc_html($success_message); ?>
            </div>
        </div>
        <?php
        
        // Return the buffered content
        return ob_get_clean();
    }
    /**
     * Add settings page to the WordPress admin menu.
     */
    public function add_settings_page() {
        add_options_page(
            __( 'Marketo Form Block Settings', 'marketo-form-block' ),
            __( 'Marketo Form Block', 'marketo-form-block' ),
            'manage_options',
            'marketo-form-block-settings',
            array( $this, 'render_settings_page' )
        );
    }
    
    /**
     * Register settings for the plugin.
     */
    public function register_settings() {
        // Check user capabilities
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        
        register_setting(
            'marketo_form_block_settings',
            'marketo_form_block_instance',
            array(
                'type' => 'string',
                'description' => __( 'Marketo Instance URL', 'marketo-form-block' ),
                'sanitize_callback' => array( $this, 'sanitize_instance_url' ),
                'default' => 'app-ab33.marketo.com',
            )
        );
        
        register_setting(
            'marketo_form_block_settings',
            'marketo_form_block_munchkin_id',
            array(
                'type' => 'string',
                'description' => __( 'Marketo Munchkin ID', 'marketo-form-block' ),
                'sanitize_callback' => array( $this, 'sanitize_munchkin_id' ),
                'default' => '041-FSQ-281',
            )
        );
        
        add_settings_section(
            'marketo_form_block_general_section',
            __( 'Marketo API Settings', 'marketo-form-block' ),
            array( $this, 'render_general_section' ),
            'marketo-form-block-settings'
        );
        
        add_settings_field(
            'marketo_form_block_instance',
            __( 'Marketo Instance URL', 'marketo-form-block' ),
            array( $this, 'render_instance_field' ),
            'marketo-form-block-settings',
            'marketo_form_block_general_section'
        );
        
        add_settings_field(
            'marketo_form_block_munchkin_id',
            __( 'Marketo Munchkin ID', 'marketo-form-block' ),
            array( $this, 'render_munchkin_field' ),
            'marketo-form-block-settings',
            'marketo_form_block_general_section'
        );
    }
    
    /**
     * Render the settings page.
     */
    public function render_settings_page() {
        // Verify user capabilities
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'marketo-form-block' ) );
        }
        
        // Check if we need to run the connection test
        $test_result = '';
        if ( isset( $_POST['marketo_test_connection'] ) &&
             check_admin_referer( 'marketo_test_connection' ) &&
             current_user_can( 'manage_options' ) ) {
            $test_result = $this->test_marketo_connection();
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            
            <?php if ( ! empty( $test_result ) ) : ?>
                <div class="notice <?php echo esc_attr( $test_result['success'] ? 'notice-success' : 'notice-error' ); ?> is-dismissible">
                    <p><?php echo wp_kses( $test_result['message'], array(
                        'code' => array(),
                        'br' => array(),
                        'ul' => array(),
                        'li' => array(),
                        'strong' => array(),
                    ) ); ?></p>
                </div>
            <?php endif; ?>
            
            <form action="options.php" method="post">
                <?php
                settings_fields( 'marketo_form_block_settings' );
                do_settings_sections( 'marketo-form-block-settings' );
                submit_button();
                ?>
            </form>
            
            <hr>
            
            <h2><?php esc_html_e( 'Test Marketo Connection', 'marketo-form-block' ); ?></h2>
            <p><?php esc_html_e( 'Use this button to test if your Marketo instance is accessible.', 'marketo-form-block' ); ?></p>
            
            <form method="post">
                <?php wp_nonce_field( 'marketo_test_connection' ); ?>
                <input type="hidden" name="marketo_test_connection" value="1">
                <?php submit_button( __( 'Test Connection', 'marketo-form-block' ), 'secondary', 'submit', false ); ?>
            </form>
            
            <hr>
            
            <h2><?php esc_html_e( 'Troubleshooting', 'marketo-form-block' ); ?></h2>
            <p><?php esc_html_e( 'If you\'re having trouble with the Marketo Form Block, try these steps:', 'marketo-form-block' ); ?></p>
            <ol>
                <li><?php esc_html_e( 'Verify your Marketo Instance URL and Munchkin ID are correct.', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Test the connection using the button above.', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Check your browser\'s console for any JavaScript errors.', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Ensure your Marketo form ID is correct when adding the block.', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Try disabling other plugins that might be interfering with script loading.', 'marketo-form-block' ); ?></li>
            </ol>
            
            <hr>
            
            <h2><?php esc_html_e( 'Security Information', 'marketo-form-block' ); ?></h2>
            <p><?php esc_html_e( 'This plugin implements the following security measures:', 'marketo-form-block' ); ?></p>
            <ul>
                <li><?php esc_html_e( 'Input Sanitization: All user inputs are sanitized using WordPress sanitization functions', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Output Escaping: All outputs are properly escaped to prevent XSS attacks', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'CSRF Protection: All forms and AJAX requests use WordPress nonces', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Capability Checks: All admin actions require appropriate user capabilities', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Content Security Policy: Restricts script sources to prevent XSS attacks', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Error Handling: Proper error handling to prevent information disclosure', 'marketo-form-block' ); ?></li>
                <li><?php esc_html_e( 'Data Validation: All data is validated before use', 'marketo-form-block' ); ?></li>
            </ul>
        </div>
        <?php
    }
    
    /**
     * Test the connection to Marketo.
     *
     * @return array Test result with success status and message.
     */
    private function test_marketo_connection() {
        $instance = get_option( 'marketo_form_block_instance', 'app-ab33.marketo.com' );
        $instance = preg_replace( '#^https?://#', '', $instance );
        
        // Ensure the instance is properly sanitized before creating the URL
        $instance = sanitize_text_field( $instance );
        
        // Use esc_url_raw for URLs that will be used in HTTP requests
        $url = esc_url_raw( 'https://' . $instance . '/js/forms2/js/forms2.min.js' );
        
        
        $response = wp_remote_get( $url, array(
            'timeout' => 15,
            'sslverify' => true,
            'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . get_bloginfo( 'url' ),
            'headers' => array(
                'Referer' => site_url(),
                'Origin' => site_url(),
            ),
        ) );
        
        if ( is_wp_error( $response ) ) {
            $error_message = $response->get_error_message();
            
            return array(
                'success' => false,
                'message' => sprintf(
                    __( 'Connection failed: %s', 'marketo-form-block' ),
                    '<code>' . esc_html( $error_message ) . '</code>'
                ) . '<br><br>' .
                __( 'Troubleshooting tips:', 'marketo-form-block' ) .
                '<ul>' .
                '<li>' . __( 'Verify your Marketo instance URL is correct', 'marketo-form-block' ) . '</li>' .
                '<li>' . __( 'Check if your server can make outbound HTTPS requests', 'marketo-form-block' ) . '</li>' .
                '<li>' . __( 'Ensure your domain is allowed in Marketo\'s CORS settings', 'marketo-form-block' ) . '</li>' .
                '</ul>',
            );
        }
        
        $code = wp_remote_retrieve_response_code( $response );
        $headers = wp_remote_retrieve_headers( $response );
        $body = wp_remote_retrieve_body( $response );
        
        
        if ( $code !== 200 ) {
            $message = sprintf(
                __( 'Connection failed with HTTP code %d. Please check your Marketo Instance URL.', 'marketo-form-block' ),
                intval( $code )
            );
            
            // Add more specific error information based on status code
            if ( $code === 403 ) {
                $message .= '<br>' . __( 'Access forbidden. Your domain may not be authorized in Marketo\'s CORS settings.', 'marketo-form-block' );
            } elseif ( $code === 404 ) {
                $message .= '<br>' . __( 'The Marketo Forms API endpoint was not found. Double-check your instance URL.', 'marketo-form-block' );
            } elseif ( $code >= 500 ) {
                $message .= '<br>' . __( 'Marketo server error. The service might be temporarily unavailable.', 'marketo-form-block' );
            }
            
            
            return array(
                'success' => false,
                'message' => $message,
            );
        }
        
        // Check if the response actually contains the Marketo Forms API
        if ( strpos( $body, 'MktoForms2' ) === false ) {
            
            return array(
                'success' => false,
                'message' => __( 'Connection succeeded but the response does not appear to be the Marketo Forms API. Please check your Marketo Instance URL.', 'marketo-form-block' ),
            );
        }
        
        // Check for CORS headers
        $has_cors_headers = isset( $headers['access-control-allow-origin'] );
        
        
        $message = __( 'Connection successful! Your Marketo instance is accessible.', 'marketo-form-block' );
        
        if ( ! $has_cors_headers ) {
            $message .= '<br><br>' . __( 'Note: The Marketo server did not return CORS headers. This might cause issues with form loading on the frontend.', 'marketo-form-block' );
        }
        
        return array(
            'success' => true,
            'message' => $message,
        );
    }
    
    /**
     * Render the general section description.
     */
    public function render_general_section() {
        echo '<p>' . esc_html__( 'Configure your Marketo API settings below. These are required for the Marketo Form Block to function correctly.', 'marketo-form-block' ) . '</p>';
        
    }
    
    /**
     * Render the Marketo instance field.
     */
    public function render_instance_field() {
        $instance = get_option( 'marketo_form_block_instance', 'app-ab33.marketo.com' );
        // Ensure the value is properly sanitized
        $instance = sanitize_text_field( $instance );
        ?>
        <input type="text" name="marketo_form_block_instance" value="<?php echo esc_attr( $instance ); ?>" class="regular-text" />
        <p class="description"><?php esc_html_e( 'Your Marketo instance URL (e.g., app-ab33.marketo.com)', 'marketo-form-block' ); ?></p>
        <?php
    }
    
    /**
     * Render the Munchkin ID field.
     */
    public function render_munchkin_field() {
        $munchkin_id = get_option( 'marketo_form_block_munchkin_id', '041-FSQ-281' );
        // Ensure the value is properly sanitized
        $munchkin_id = sanitize_text_field( $munchkin_id );
        ?>
        <input type="text" name="marketo_form_block_munchkin_id" value="<?php echo esc_attr( $munchkin_id ); ?>" class="regular-text" />
        <p class="description"><?php esc_html_e( 'Your Marketo Munchkin ID (e.g., 041-FSQ-281)', 'marketo-form-block' ); ?></p>
        <?php
    }
    
    /**
     * Sanitize and validate the Marketo instance URL.
     *
     * @param string $input The input to sanitize.
     * @return string The sanitized input.
     */
    public function sanitize_instance_url( $input ) {
        // Sanitize input
        $input = sanitize_text_field( $input );
        
        // Remove any protocol prefix
        $input = preg_replace( '#^https?://#', '', $input );
        
        // Remove any trailing slashes
        $input = rtrim( $input, '/' );
        
        // Basic validation - should look like app-something.marketo.com
        if ( ! preg_match( '/^app-[a-z0-9]+\.marketo\.com$/i', $input ) ) {
            add_settings_error(
                'marketo_form_block_instance',
                'invalid_instance',
                __( 'The Marketo Instance URL should be in the format app-XXXX.marketo.com', 'marketo-form-block' )
            );
            
            // Return the default if invalid
            return 'app-ab33.marketo.com';
        }
        
        return $input;
    }
    
    /**
     * Sanitize and validate the Munchkin ID.
     *
     * @param string $input The input to sanitize.
     * @return string The sanitized input.
     */
    public function sanitize_munchkin_id( $input ) {
        // Sanitize input
        $input = sanitize_text_field( $input );
        
        // Basic validation - should look like XXX-XXX-XXX
        if ( ! preg_match( '/^[0-9]{3}-[A-Z0-9]{3}-[0-9]{3}$/i', $input ) ) {
            add_settings_error(
                'marketo_form_block_munchkin_id',
                'invalid_munchkin_id',
                __( 'The Munchkin ID should be in the format XXX-XXX-XXX (e.g., 041-FSQ-281)', 'marketo-form-block' )
            );
            
            // Return the default if invalid
            return '041-FSQ-281';
        }
        
        return $input;
    }

    /**
     * Register Customizer settings for the plugin.
     *
     * @param WP_Customize_Manager $wp_customize The Customizer object.
     */
    public function register_customizer_settings( $wp_customize ) {
        $wp_customize->add_section( 'marketo_form_block_defaults', array(
            'title'    => __( 'Marketo Form Block Defaults', 'marketo-form-block' ),
            'priority' => 30,
        ) );

        // Global Custom CSS
        $wp_customize->add_setting( 'marketo_form_block_custom_css', array(
            'default'           => '',
            'sanitize_callback' => 'wp_strip_all_tags',
        ) );
        $wp_customize->add_control( 'marketo_form_block_custom_css', array(
            'label'    => __( 'Global Custom CSS', 'marketo-form-block' ),
            'section'  => 'marketo_form_block_defaults',
            'settings' => 'marketo_form_block_custom_css',
            'type'     => 'textarea',
        ) );
    }

    /**
     * Get the hex value for a color slug.
     *
     * @param string $slug The color slug.
     * @param string $default The default color.
     * @return string The hex color value.
     */
    private function get_color_value( $slug, $default ) {
        if ( empty( $slug ) ) {
            return $default;
        }
        if ( preg_match( '/^#([a-f0-9]{3}){1,2}$/i', $slug ) ) {
            return $slug;
        }
        $color_palette = get_theme_support( 'editor-color-palette' );
        if ( ! empty( $color_palette[0] ) ) {
            foreach ( $color_palette[0] as $color ) {
                if ( $color['slug'] === $slug ) {
                    return $color['color'];
                }
            }
        }
        return $default;
    }
}

// Initialize the plugin
$marketo_form_block = new Marketo_Form_Block_Core();