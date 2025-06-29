<?php
/**
 * Marketo Form Block - Main Class
 *
 * @package Marketo_Form_Block
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Class Marketo_Form_Block_Main
 *
 * Handles the server-side functionality of the Marketo Form Block.
 */
class Marketo_Form_Block_Main {

    /**
     * Instance of this class.
     *
     * @var object
     */
    protected static $instance = null;

    /**
     * Initialize the plugin.
     */
    private function __construct() {
        // Add actions and filters
        add_action( 'init', array( $this, 'load_textdomain' ) );
        add_filter( 'script_loader_tag', array( $this, 'add_async_defer_to_marketo_script' ), 10, 3 );
    }

    /**
     * Return an instance of this class.
     *
     * @return object A single instance of this class.
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Load the plugin text domain for translation.
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'marketo-form-block',
            false,
            dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/languages/'
        );
    }

    /**
     * Add async and defer attributes to Marketo script.
     *
     * @param string $tag    The script tag.
     * @param string $handle The script handle.
     * @param string $src    The script source.
     * @return string Modified script tag.
     */
    public function add_async_defer_to_marketo_script( $tag, $handle, $src ) {
        if ( 'marketo-forms-js' !== $handle ) {
            return $tag;
        }
        
        // Add async and defer attributes
        return str_replace( ' src', ' async defer src', $tag );
    }

    /**
     * Get Marketo instance ID and Munchkin ID from the form embed code.
     *
     * @param string $form_id The Marketo form ID.
     * @return array An array containing the instance ID and Munchkin ID.
     */
    public function get_marketo_ids( $form_id ) {
        // These would typically be set in the plugin settings
        // For now, we'll return placeholder values
        return array(
            'instance_id' => 'app-ab12',
            'munchkin_id' => 'XXX-YYY-ZZZ',
        );
    }

    /**
     * Validate form settings.
     *
     * @param array $settings The form settings to validate.
     * @return array Validated settings.
     */
    public function validate_form_settings( $settings ) {
        $defaults = array(
            'formId'              => '',
            'redirectUrl'         => '',
            'successMessage'      => __( 'Thank you for your submission!', 'marketo-form-block' ),
            'errorMessage'        => __( 'There was an error processing your submission. Please try again.', 'marketo-form-block' ),
            'customCSS'           => '',
            'disableDefaultStyles' => true,
        );

        $validated = array();

        // Validate form ID (required)
        $validated['formId'] = isset( $settings['formId'] ) ? sanitize_text_field( $settings['formId'] ) : '';

        // Validate redirect URL
        $validated['redirectUrl'] = isset( $settings['redirectUrl'] ) ? esc_url_raw( $settings['redirectUrl'] ) : '';

        // Validate messages
        $validated['successMessage'] = isset( $settings['successMessage'] ) ? wp_kses_post( $settings['successMessage'] ) : $defaults['successMessage'];
        $validated['errorMessage'] = isset( $settings['errorMessage'] ) ? wp_kses_post( $settings['errorMessage'] ) : $defaults['errorMessage'];

        // Validate custom CSS
        $validated['customCSS'] = isset( $settings['customCSS'] ) ? $this->sanitize_css( $settings['customCSS'] ) : '';

        // Validate disable default styles
        $validated['disableDefaultStyles'] = isset( $settings['disableDefaultStyles'] ) ? (bool) $settings['disableDefaultStyles'] : $defaults['disableDefaultStyles'];

        return $validated;
    }

    /**
     * Basic CSS sanitization.
     *
     * @param string $css The CSS to sanitize.
     * @return string Sanitized CSS.
     */
    private function sanitize_css( $css ) {
        // Remove potentially malicious CSS
        $css = preg_replace( '/expression\s*\(.*\)/i', '', $css );
        $css = preg_replace( '/behavior\s*:.*?;/i', '', $css );
        $css = preg_replace( '/@import\s+[^;]+;/i', '', $css );
        
        return $css;
    }
}

// Initialize the class
Marketo_Form_Block_Main::get_instance();