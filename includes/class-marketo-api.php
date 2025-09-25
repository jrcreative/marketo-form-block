<?php
/**
 * Marketo API handler
 *
 * @package Marketo_Form_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Class Marketo_API
 *
 * Handles all interactions with the Marketo API.
 */
class Marketo_API {

    /**
     * The single instance of the class.
     *
     * @var Marketo_API
     */
    private static $instance = null;

    /**
     * Marketo API constructor.
     */
    private function __construct() {
        // Register AJAX actions for both logged-in and non-logged-in users
        add_action( 'wp_ajax_marketo_proxy_form_submission', array( $this, 'proxy_form_submission' ) );
        add_action( 'wp_ajax_nopriv_marketo_proxy_form_submission', array( $this, 'proxy_form_submission' ) );
    }

    /**
     * Get the singleton instance of the class.
     *
     * @return Marketo_API
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Test the connection to Marketo.
     *
     * @return array Test result with success status and message.
     */
    public function test_connection() {
        $instance = get_option( 'marketo_form_block_instance', 'app-ab33.marketo.com' );
        $instance = preg_replace( '#^https?://#', '', $instance );
        $instance = sanitize_text_field( $instance );
        $url      = esc_url_raw( 'https://' . $instance . '/js/forms2/js/forms2.min.js' );

        $response = wp_remote_get(
            $url,
            array(
                'timeout'    => 15,
                'sslverify'  => true,
                'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . get_bloginfo( 'url' ),
                'headers'    => array(
                    'Referer' => site_url(),
                    'Origin'  => site_url(),
                ),
            )
        );

        if ( is_wp_error( $response ) ) {
            return array(
                'success' => false,
                'message' => sprintf(
                    __( 'Connection failed: %s', 'marketo-form-block' ),
                    '<code>' . esc_html( $response->get_error_message() ) . '</code>'
                ),
            );
        }

        $code = wp_remote_retrieve_response_code( $response );

        if ( 200 !== $code ) {
            return array(
                'success' => false,
                'message' => sprintf(
                    __( 'Connection failed with HTTP code %d.', 'marketo-form-block' ),
                    intval( $code )
                ),
            );
        }

        return array(
            'success' => true,
            'message' => __( 'Connection successful! Your Marketo instance is accessible.', 'marketo-form-block' ),
        );
    }

    /**
     * Proxy for form submissions to avoid CORS issues.
     */
    public function proxy_form_submission() {
        // Security checks
        if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'marketo_form_block' ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid nonce.', 'marketo-form-block' ) ), 403 );
        }

        $form_id = isset( $_POST['formId'] ) ? sanitize_text_field( wp_unslash( $_POST['formId'] ) ) : '';
        if ( empty( $form_id ) ) {
            wp_send_json_error( array( 'message' => __( 'Missing Form ID.', 'marketo-form-block' ) ), 400 );
        }

        // Reconstruct form data for Marketo
        $form_data = array();
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
        foreach ( $_POST as $key => $value ) {
            if ( ! in_array( $key, array( 'action', 'nonce', 'formId' ), true ) ) {
                $form_data[ $key ] = sanitize_text_field( wp_unslash( $value ) );
            }
        }

        $instance    = get_option( 'marketo_form_block_instance', 'app-ab33.marketo.com' );
        $munchkin_id = get_option( 'marketo_form_block_munchkin_id', '041-FSQ-281' );
        $instance    = sanitize_text_field( $instance );
        $munchkin_id = sanitize_text_field( $munchkin_id );

        $marketo_url = sprintf(
            'https://%s/index.php/leadCapture/save2',
            $instance
        );

        $response = wp_remote_post(
            $marketo_url,
            array(
                'body'    => http_build_query(
                    array_merge(
                        $form_data,
                        array(
                            'formid'      => $form_id,
                            'munchkinId'  => $munchkin_id,
                            'formVid'     => '', // Let Marketo handle this
                            'lpId'        => '',
                            'subId'       => '',
                            'retURL'      => '',
                            'lpurl'       => '',
                            'kw'          => '',
                            'q'           => '',
                            '_mkt_trk'    => '',
                            'followup'    => 'false',
                            'cr'          => '',
                            'cr_param'    => '',
                            'cr_value'    => '',
                            'cr_op'       => '',
                            'cr_date'     => '',
                            'cr_unit'     => '',
                            'cr_period'   => '',
                            'cr_action'   => '',
                            'cr_program'  => '',
                            'cr_flow'     => '',
                            'cr_camp'     => '',
                            'cr_camp_id'  => '',
                            'cr_camp_type' => '',
                            'cr_camp_medium' => '',
                            'cr_camp_source' => '',
                            'cr_camp_content' => '',
                            'cr_camp_term' => '',
                        )
                    )
                ),
                'headers' => array(
                    'Content-Type' => 'application/x-www-form-urlencoded',
                    'User-Agent'   => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . get_bloginfo( 'url' ),
                ),
            )
        );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error(
                array(
                    'message' => $response->get_error_message(),
                ),
                500
            );
        }

        $response_code = wp_remote_retrieve_response_code( $response );
        $response_body = wp_remote_retrieve_body( $response );

        if ( 200 !== $response_code ) {
            wp_send_json_error(
                array(
                    'message' => sprintf(
                        __( 'Marketo API returned HTTP %d', 'marketo-form-block' ),
                        $response_code
                    ),
                    'details' => $response_body,
                ),
                $response_code
            );
        }

        wp_send_json_success( array( 'message' => __( 'Form submitted successfully.', 'marketo-form-block' ) ) );
    }
}

// Initialize the API handler
Marketo_API::get_instance();