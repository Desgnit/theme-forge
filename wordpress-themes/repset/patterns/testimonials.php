<?php
/**
 * Title: Testimonials
 * Slug: repset/testimonials
 * Categories: repset
 * Description: Split section — moody image beside member quotes with crimson rules.
 * Viewport Width: 1400
 *
 * @package Repset
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"0","bottom":"0"},"blockGap":"0"}},"backgroundColor":"asphalt","layout":{"type":"constrained","contentSize":"100%"}} -->
<div class="wp-block-group alignfull has-asphalt-background-color has-background" style="padding-top:0;padding-bottom:0">
	<!-- wp:columns {"isStackedOnMobile":true,"align":"full","style":{"spacing":{"blockGap":{"left":"0"}}}} -->
	<div class="wp-block-columns alignfull">
		<!-- wp:column {"width":"44%","style":{"spacing":{"blockGap":"0"}}} -->
		<div class="wp-block-column" style="flex-basis:44%">
			<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( 'assets/img/kettlebell-swing.jpg' ) ); ?>","dimRatio":20,"overlayColor":"charcoal","isUserOverlayColor":true,"minHeight":100,"minHeightUnit":"%","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"layout":{"type":"constrained"}} -->
			<div class="wp-block-cover" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--70);min-height:100%">
				<span aria-hidden="true" class="wp-block-cover__background has-charcoal-background-color has-background-dim-20 has-background-dim"></span>
				<img class="wp-block-cover__image-background" alt="<?php esc_attr_e( 'Member mid kettlebell swing', 'repset' ); ?>" src="<?php echo esc_url( get_theme_file_uri( 'assets/img/kettlebell-swing.jpg' ) ); ?>" data-object-fit="cover"/>
				<div class="wp-block-cover__inner-container">
					<!-- wp:spacer {"height":"1px"} -->
					<div style="height:1px" aria-hidden="true" class="wp-block-spacer"></div>
					<!-- /wp:spacer -->
				</div>
			</div>
			<!-- /wp:cover -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"width":"56%","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|60","right":"var:preset|spacing|60"},"blockGap":"var:preset|spacing|50"}}} -->
		<div class="wp-block-column" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--60);flex-basis:56%">
			<!-- wp:paragraph {"className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
			<p class="repset-kicker has-crimson-color has-text-color has-small-font-size">Word on the floor</p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"style":{"typography":{"fontWeight":"700"}},"textColor":"white"} -->
			<h2 class="wp-block-heading has-white-color has-text-color" style="font-weight:700">Members don't lie</h2>
			<!-- /wp:heading -->

			<!-- wp:quote {"style":{"spacing":{"padding":{"left":"1.5rem"}},"border":{"left":{"color":"#e02424","style":"solid","width":"4px"}}}} -->
			<blockquote class="wp-block-quote" style="border-left-color:#e02424;border-left-style:solid;border-left-width:4px;padding-left:1.5rem">
				<!-- wp:paragraph {"textColor":"chalk","fontSize":"large"} -->
				<p class="has-chalk-color has-text-color has-large-font-size">"I joined for the free week and stayed three years. My deadlift went from 80kg to 170kg, and the 6am crew is the best part of my day."</p>
				<!-- /wp:paragraph -->
				<cite><span class="repset-kicker" style="letter-spacing:0.18em;text-transform:uppercase">Sophie M. — member since 2023</span></cite>
			</blockquote>
			<!-- /wp:quote -->

			<!-- wp:quote {"style":{"spacing":{"padding":{"left":"1.5rem"}},"border":{"left":{"color":"#e02424","style":"solid","width":"4px"}}}} -->
			<blockquote class="wp-block-quote" style="border-left-color:#e02424;border-left-style:solid;border-left-width:4px;padding-left:1.5rem">
				<!-- wp:paragraph {"textColor":"chalk","fontSize":"large"} -->
				<p class="has-chalk-color has-text-color has-large-font-size">"Proper coaching, proper kit, zero attitude. Danny rebuilt my jab in four weeks and I finally stopped dropping my right hand."</p>
				<!-- /wp:paragraph -->
				<cite><span class="repset-kicker" style="letter-spacing:0.18em;text-transform:uppercase">Adeel K. — boxing programme</span></cite>
			</blockquote>
			<!-- /wp:quote -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
