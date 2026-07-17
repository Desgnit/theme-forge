<?php
/**
 * Title: CTA Band — First Week Free
 * Slug: repset/cta-band
 * Categories: repset, call-to-action
 * Description: Full-bleed cover call-to-action with team image, dark overlay and crimson button.
 * Viewport Width: 1400
 *
 * @package Repset
 */
?>
<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( 'assets/img/team-high-five.jpg' ) ); ?>","dimRatio":70,"overlayColor":"charcoal","isUserOverlayColor":true,"minHeight":60,"minHeightUnit":"vh","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained","contentSize":"820px"}} -->
<div class="wp-block-cover alignfull" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--40);min-height:60vh">
	<span aria-hidden="true" class="wp-block-cover__background has-charcoal-background-color has-background-dim-70 has-background-dim"></span>
	<img class="wp-block-cover__image-background" alt="<?php esc_attr_e( 'Training partners high-fiving after a session', 'repset' ); ?>" src="<?php echo esc_url( get_theme_file_uri( 'assets/img/team-high-five.jpg' ) ); ?>" data-object-fit="cover"/>
	<div class="wp-block-cover__inner-container">
		<!-- wp:paragraph {"align":"center","className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
		<p class="has-text-align-center repset-kicker has-crimson-color has-text-color has-small-font-size">First week free — no card required</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontWeight":"700","lineHeight":"1.05"}},"textColor":"white","fontSize":"display"} -->
		<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color has-display-font-size" style="font-weight:700;line-height:1.05">Stop scrolling.<br>Start lifting.</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","textColor":"chalk","fontSize":"large"} -->
		<p class="has-text-align-center has-chalk-color has-text-color has-large-font-size">Book your free week, meet the coaches, and see if Forge House is your kind of loud.</p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"2rem"}}}} -->
		<div class="wp-block-buttons" style="margin-top:2rem">
			<!-- wp:button {"backgroundColor":"crimson","textColor":"white","fontSize":"large"} -->
			<div class="wp-block-button has-custom-font-size has-large-font-size"><a class="wp-block-button__link has-white-color has-crimson-background-color has-text-color has-background wp-element-button" href="#membership">Claim your free week</a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
</div>
<!-- /wp:cover -->
