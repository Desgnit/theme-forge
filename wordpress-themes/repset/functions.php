<?php
/**
 * Repset functions and definitions.
 *
 * @package Repset
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( ! defined( 'REPSET_VERSION' ) ) {
	define( 'REPSET_VERSION', '1.0.0' );
}

if ( ! function_exists( 'repset_setup' ) ) :
	/**
	 * Theme setup: supports, editor styles.
	 */
	function repset_setup() {
		// Let WordPress manage the document title.
		add_theme_support( 'title-tag' );

		// Core block theme niceties.
		add_theme_support( 'wp-block-styles' );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'align-wide' );
		add_theme_support( 'custom-logo', array(
			'height'      => 96,
			'width'       => 320,
			'flex-height' => true,
			'flex-width'  => true,
		) );

		// Editor styles so the Site Editor matches the front end.
		add_theme_support( 'editor-styles' );
		add_editor_style( array( repset_fonts_url(), 'style.css' ) );

		// Translations.
		load_theme_textdomain( 'repset', get_template_directory() . '/languages' );
	}
endif;
add_action( 'after_setup_theme', 'repset_setup' );

if ( ! function_exists( 'repset_fonts_url' ) ) :
	/**
	 * Build the Google Fonts URL: Oswald (display) + Inter (body).
	 *
	 * @return string Fonts stylesheet URL.
	 */
	function repset_fonts_url() {
		$families = array(
			'Oswald:wght@500;600;700',
			'Inter:wght@400;500',
		);

		return esc_url_raw(
			add_query_arg(
				array(
					'family'  => implode( '&family=', $families ),
					'display' => 'swap',
				),
				'https://fonts.googleapis.com/css2'
			)
		);
	}
endif;

/**
 * Enqueue front-end styles and fonts.
 */
function repset_enqueue_assets() {
	wp_enqueue_style(
		'repset-fonts',
		repset_fonts_url(),
		array(),
		REPSET_VERSION
	);

	wp_enqueue_style(
		'repset-style',
		get_stylesheet_uri(),
		array( 'repset-fonts' ),
		REPSET_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'repset_enqueue_assets' );

/**
 * Preconnect to the fonts CDN for faster first paint.
 *
 * @param array  $urls          URLs to print for resource hints.
 * @param string $relation_type The relation type the URLs are printed for.
 * @return array
 */
function repset_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
		$urls[] = 'https://fonts.googleapis.com';
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'repset_resource_hints', 10, 2 );

/**
 * Register the Repset pattern category.
 */
function repset_register_pattern_categories() {
	if ( function_exists( 'register_block_pattern_category' ) ) {
		register_block_pattern_category(
			'repset',
			array(
				'label'       => __( 'Repset', 'repset' ),
				'description' => __( 'Gym-poster sections: hero, timetable, pricing, trainers, stats and more.', 'repset' ),
			)
		);
	}
}
add_action( 'init', 'repset_register_pattern_categories', 9 );
