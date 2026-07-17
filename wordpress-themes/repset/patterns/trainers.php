<?php
/**
 * Title: Trainers Grid
 * Slug: repset/trainers
 * Categories: repset
 * Description: Four coach cards with portraits, specialisms and credentials.
 * Viewport Width: 1400
 *
 * @package Repset
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"},"blockGap":"var:preset|spacing|50"}},"backgroundColor":"charcoal","layout":{"type":"constrained","contentSize":"1240px"}} -->
<div id="coaches" class="wp-block-group alignfull has-charcoal-background-color has-background" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"0.75rem"}},"layout":{"type":"constrained","justifyContent":"left","contentSize":"1240px"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
		<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">The Coaches</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"style":{"typography":{"fontWeight":"700"}},"textColor":"white"} -->
		<h2 class="wp-block-heading has-white-color has-text-color" style="font-weight:700">People who put in the reps</h2>
		<!-- /wp:heading -->

		<!-- wp:separator {"className":"repset-rule","backgroundColor":"crimson"} -->
		<hr class="wp-block-separator has-text-color has-crimson-color has-alpha-channel-opacity has-crimson-background-color has-background repset-rule"/>
		<!-- /wp:separator -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|40","top":"var:preset|spacing|40"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column {"className":"repset-card"} -->
		<div class="wp-block-column repset-card">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/trainer-portrait.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Head coach Marcus Oyelaran', 'repset' ); ?>" style="aspect-ratio:3/4;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"1rem"}}},"fontSize":"large"} -->
			<h3 class="wp-block-heading has-large-font-size" style="margin-top:1rem">Marcus Oyelaran</h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
			<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">Head Coach · Strength</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
			<p class="has-concrete-color has-text-color has-small-font-size">Former GB U23 powerlifter. 12 years coaching, 600kg+ club founder. Writes every Strength Foundations cycle.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"repset-card"} -->
		<div class="wp-block-column repset-card">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/woman-weights.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Coach Erin Caldwell training with dumbbells', 'repset' ); ?>" style="aspect-ratio:3/4;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"1rem"}}},"fontSize":"large"} -->
			<h3 class="wp-block-heading has-large-font-size" style="margin-top:1rem">Erin Caldwell</h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
			<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">Conditioning Lead</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
			<p class="has-concrete-color has-text-color has-small-font-size">CrossFit L3 and ex-national rower. Runs the 07:00 conditioning class and somehow enjoys it.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"repset-card"} -->
		<div class="wp-block-column repset-card">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/athlete-portrait-dark.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Boxing coach Danny Whitfield', 'repset' ); ?>" style="aspect-ratio:3/4;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"1rem"}}},"fontSize":"large"} -->
			<h3 class="wp-block-heading has-large-font-size" style="margin-top:1rem">Danny Whitfield</h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
			<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">Boxing Coach</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
			<p class="has-concrete-color has-text-color has-small-font-size">42 amateur bouts, England Boxing Level 2. Pads sharp enough to fix your footwork in a month.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"repset-card"} -->
		<div class="wp-block-column repset-card">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/athlete-chalk.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Olympic lifting coach Priya Shah chalking up', 'repset' ); ?>" style="aspect-ratio:3/4;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"1rem"}}},"fontSize":"large"} -->
			<h3 class="wp-block-heading has-large-font-size" style="margin-top:1rem">Priya Shah</h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
			<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">Olympic Lifting</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
			<p class="has-concrete-color has-text-color has-small-font-size">BWL Level 2, English Championships qualifier at 59kg. Obsessive about bar paths and bracing.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
