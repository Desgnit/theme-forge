<?php
/**
 * Title: Class Timetable Grid
 * Slug: repset/class-timetable
 * Categories: repset
 * Description: Image-led class cards with weekly session times for the five core programmes.
 * Viewport Width: 1400
 *
 * @package Repset
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"},"blockGap":"var:preset|spacing|50"}},"backgroundColor":"charcoal","layout":{"type":"constrained","contentSize":"1240px"}} -->
<div id="classes" class="wp-block-group alignfull has-charcoal-background-color has-background" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"bottom"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:group {"style":{"spacing":{"blockGap":"0.75rem"}},"layout":{"type":"constrained","justifyContent":"left"}} -->
		<div class="wp-block-group">
			<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
			<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">The Programme</p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"style":{"typography":{"fontWeight":"700"}},"textColor":"white"} -->
			<h2 class="wp-block-heading has-white-color has-text-color" style="font-weight:700">Pick your fight</h2>
			<!-- /wp:heading -->

			<!-- wp:separator {"className":"repset-rule","backgroundColor":"crimson"} -->
			<hr class="wp-block-separator has-text-color has-crimson-color has-alpha-channel-opacity has-crimson-background-color has-background repset-rule"/>
			<!-- /wp:separator -->
		</div>
		<!-- /wp:group -->

		<!-- wp:paragraph {"style":{"layout":{"selfStretch":"fixed","flexSize":"420px"}},"textColor":"concrete"} -->
		<p class="has-concrete-color has-text-color" style="flex-basis:420px">Five programmes, one standard. Every class is capped at 14 so the coach can actually coach. Book through the app up to seven days ahead.</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|40","top":"var:preset|spacing|40"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column {"className":"repset-card","style":{"spacing":{"blockGap":"0"}},"backgroundColor":"asphalt"} -->
		<div class="wp-block-column repset-card has-asphalt-background-color has-background">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none","style":{"spacing":{"margin":{"bottom":"0"}}}} -->
			<figure class="wp-block-image size-large" style="margin-bottom:0"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/barbell-squat.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Athlete under a heavy barbell back squat', 'repset' ); ?>" style="aspect-ratio:4/3;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:group {"style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.75rem","left":"1.5rem","right":"1.5rem"},"blockGap":"0.6rem"}},"layout":{"type":"constrained","justifyContent":"left"}} -->
			<div class="wp-block-group" style="padding-top:1.5rem;padding-right:1.5rem;padding-bottom:1.75rem;padding-left:1.5rem">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size">Strength Foundations</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
				<p class="has-concrete-color has-text-color has-small-font-size">Squat, press, hinge, pull. Barbell technique built from the ground up over an 8-week cycle.</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","letterSpacing":"0.1em","textTransform":"uppercase"}},"textColor":"crimson","fontSize":"small","fontFamily":"display"} -->
				<p class="has-crimson-color has-text-color has-display-font-family has-small-font-size" style="font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Mon / Wed / Fri — 06:15 &amp; 18:30</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"repset-card","style":{"spacing":{"blockGap":"0"}},"backgroundColor":"asphalt"} -->
		<div class="wp-block-column repset-card has-asphalt-background-color has-background">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none","style":{"spacing":{"margin":{"bottom":"0"}}}} -->
			<figure class="wp-block-image size-large" style="margin-bottom:0"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/battle-ropes.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Athlete slamming battle ropes mid-workout', 'repset' ); ?>" style="aspect-ratio:4/3;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:group {"style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.75rem","left":"1.5rem","right":"1.5rem"},"blockGap":"0.6rem"}},"layout":{"type":"constrained","justifyContent":"left"}} -->
			<div class="wp-block-group" style="padding-top:1.5rem;padding-right:1.5rem;padding-bottom:1.75rem;padding-left:1.5rem">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size">Conditioning</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
				<p class="has-concrete-color has-text-color has-small-font-size">45 minutes of ropes, sleds, ergs and bad decisions. Scaled to every level, brutal at all of them.</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","letterSpacing":"0.1em","textTransform":"uppercase"}},"textColor":"crimson","fontSize":"small","fontFamily":"display"} -->
				<p class="has-crimson-color has-text-color has-display-font-family has-small-font-size" style="font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Daily — 07:00, 12:15 &amp; 19:30</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"repset-card","style":{"spacing":{"blockGap":"0"}},"backgroundColor":"asphalt"} -->
		<div class="wp-block-column repset-card has-asphalt-background-color has-background">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none","style":{"spacing":{"margin":{"bottom":"0"}}}} -->
			<figure class="wp-block-image size-large" style="margin-bottom:0"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/boxing-training.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Boxer working the heavy bag in gloves', 'repset' ); ?>" style="aspect-ratio:4/3;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:group {"style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.75rem","left":"1.5rem","right":"1.5rem"},"blockGap":"0.6rem"}},"layout":{"type":"constrained","justifyContent":"left"}} -->
			<div class="wp-block-group" style="padding-top:1.5rem;padding-right:1.5rem;padding-bottom:1.75rem;padding-left:1.5rem">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size">Boxing</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
				<p class="has-concrete-color has-text-color has-small-font-size">Bag work, pads and footwork with amateur-circuit coaches. Sparring is optional, sweat is not.</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","letterSpacing":"0.1em","textTransform":"uppercase"}},"textColor":"crimson","fontSize":"small","fontFamily":"display"} -->
				<p class="has-crimson-color has-text-color has-display-font-family has-small-font-size" style="font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Tue / Thu — 18:00 · Sat — 10:00</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|40","top":"var:preset|spacing|40"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column {"className":"repset-card","style":{"spacing":{"blockGap":"0"}},"backgroundColor":"asphalt"} -->
		<div class="wp-block-column repset-card has-asphalt-background-color has-background">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none","style":{"spacing":{"margin":{"bottom":"0"}}}} -->
			<figure class="wp-block-image size-large" style="margin-bottom:0"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/deadlift-setup.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Lifter setting up for a heavy deadlift', 'repset' ); ?>" style="aspect-ratio:16/9;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:group {"style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.75rem","left":"1.5rem","right":"1.5rem"},"blockGap":"0.6rem"}},"layout":{"type":"constrained","justifyContent":"left"}} -->
			<div class="wp-block-group" style="padding-top:1.5rem;padding-right:1.5rem;padding-bottom:1.75rem;padding-left:1.5rem">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size">Olympic Lifting Club</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
				<p class="has-concrete-color has-text-color has-small-font-size">Snatch and clean &amp; jerk under a BWL Level 2 coach. Platforms, competition bars, video review.</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","letterSpacing":"0.1em","textTransform":"uppercase"}},"textColor":"crimson","fontSize":"small","fontFamily":"display"} -->
				<p class="has-crimson-color has-text-color has-display-font-family has-small-font-size" style="font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Tue / Thu — 19:15 · Sun — 09:30</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"repset-card","style":{"spacing":{"blockGap":"0"}},"backgroundColor":"asphalt"} -->
		<div class="wp-block-column repset-card has-asphalt-background-color has-background">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none","style":{"spacing":{"margin":{"bottom":"0"}}}} -->
			<figure class="wp-block-image size-large" style="margin-bottom:0"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/img/gym-rack-row.jpg' ) ); ?>" alt="<?php esc_attr_e( 'Row of squat racks on the open gym floor', 'repset' ); ?>" style="aspect-ratio:16/9;object-fit:cover"/></figure>
			<!-- /wp:image -->

			<!-- wp:group {"style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.75rem","left":"1.5rem","right":"1.5rem"},"blockGap":"0.6rem"}},"layout":{"type":"constrained","justifyContent":"left"}} -->
			<div class="wp-block-group" style="padding-top:1.5rem;padding-right:1.5rem;padding-bottom:1.75rem;padding-left:1.5rem">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size">Open Gym</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"concrete","fontSize":"small"} -->
				<p class="has-concrete-color has-text-color has-small-font-size">Fourteen racks, six platforms, calibrated plates and no time limit. Run your own programme.</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","letterSpacing":"0.1em","textTransform":"uppercase"}},"textColor":"crimson","fontSize":"small","fontFamily":"display"} -->
				<p class="has-crimson-color has-text-color has-display-font-family has-small-font-size" style="font-weight:600;letter-spacing:0.1em;text-transform:uppercase">Every day — all opening hours</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
