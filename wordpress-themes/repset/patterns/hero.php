<?php
/**
 * Title: Hero — Train Like You Mean It
 * Slug: repset/hero
 * Categories: repset, featured
 * Description: Full-bleed cover hero with dark gym interior, colossal Oswald headline and crimson CTA.
 * Viewport Width: 1400
 *
 * @package Repset
 */
?>
<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( 'assets/img/gym-dark-interior.jpg' ) ); ?>","dimRatio":60,"overlayColor":"charcoal","isUserOverlayColor":true,"minHeight":92,"minHeightUnit":"vh","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<div class="wp-block-cover alignfull" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--40);min-height:92vh">
	<span aria-hidden="true" class="wp-block-cover__background has-charcoal-background-color has-background-dim-60 has-background-dim"></span>
	<img class="wp-block-cover__image-background" alt="<?php esc_attr_e( 'Dark industrial gym interior with racks and plates', 'repset' ); ?>" src="<?php echo esc_url( get_theme_file_uri( 'assets/img/gym-dark-interior.jpg' ) ); ?>" data-object-fit="cover"/>
	<div class="wp-block-cover__inner-container">
		<!-- wp:group {"align":"wide","layout":{"type":"constrained","contentSize":"960px","justifyContent":"left"}} -->
		<div class="wp-block-group alignwide">
			<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
			<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">Forge House Gym — Ancoats, Manchester</p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"level":1,"style":{"typography":{"fontWeight":"700","lineHeight":"1","textTransform":"uppercase"}},"textColor":"white","fontSize":"colossal","fontFamily":"display"} -->
			<h1 class="wp-block-heading has-white-color has-text-color has-display-font-family has-colossal-font-size" style="font-weight:700;line-height:1;text-transform:uppercase">Train like<br>you <mark style="background-color:rgba(0,0,0,0)" class="has-inline-color has-crimson-color">mean it</mark></h1>
			<!-- /wp:heading -->

			<!-- wp:separator {"className":"repset-rule","backgroundColor":"crimson"} -->
			<hr class="wp-block-separator has-text-color has-crimson-color has-alpha-channel-opacity has-crimson-background-color has-background repset-rule"/>
			<!-- /wp:separator -->

			<!-- wp:paragraph {"style":{"layout":{"selfStretch":"fixed","flexSize":"580px"}},"textColor":"chalk","fontSize":"large"} -->
			<p class="has-chalk-color has-text-color has-large-font-size">No mirrors for posing. No lounge music. 12,000 square feet of iron, chalk and coaching that actually makes you stronger. Strength, conditioning and boxing under one roof in Ancoats.</p>
			<!-- /wp:paragraph -->

			<!-- wp:buttons {"style":{"spacing":{"blockGap":"1rem","margin":{"top":"2.5rem"}}}} -->
			<div class="wp-block-buttons" style="margin-top:2.5rem">
				<!-- wp:button {"backgroundColor":"crimson","textColor":"white"} -->
				<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-crimson-background-color has-text-color has-background wp-element-button" href="#membership">Start your free week</a></div>
				<!-- /wp:button -->

				<!-- wp:button {"textColor":"white","className":"is-style-outline"} -->
				<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#classes">View the timetable</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:group -->
	</div>
</div>
<!-- /wp:cover -->
