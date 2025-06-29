<?php
/**
 * Uninstall Marketo Form Block
 *
 * @package Marketo_Form_Block
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Currently, this plugin doesn't store any data in the database.
// If future versions add options or custom post types, cleanup code would go here.