<?php
/**
 * Title: Membership Pricing Table
 * Slug: repset/pricing
 * Categories: repset
 * Description: Three membership tiers with the Unlimited tier highlighted in crimson.
 * Viewport Width: 1400
 *
 * @package Repset
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"},"blockGap":"var:preset|spacing|50"}},"backgroundColor":"asphalt","layout":{"type":"constrained","contentSize":"1240px"}} -->
<div id="membership" class="wp-block-group alignfull has-asphalt-background-color has-background" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"0.75rem"}},"layout":{"type":"constrained","contentSize":"640px"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"align":"center","className":"repset-kicker","textColor":"crimson","fontSize":"small"} -->
		<p class="has-text-align-center repset-kicker has-crimson-color has-text-color has-small-font-size">Membership</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontWeight":"700"}},"textColor":"white"} -->
		<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="font-weight:700">No contracts. No nonsense.</h2>
		<!-- /wp:heading -->

		<!-- wp:separator {"className":"repset-rule aligncenter","backgroundColor":"crimson"} -->
		<hr class="wp-block-separator has-text-color has-crimson-color has-alpha-channel-opacity has-crimson-background-color has-background repset-rule aligncenter"/>
		<!-- /wp:separator -->

		<!-- wp:paragraph {"align":"center","textColor":"concrete"} -->
		<p class="has-text-align-center has-concrete-color has-text-color">Rolling monthly memberships. Cancel with 30 days' notice. Every plan starts with a free week on the floor.</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"verticalAlignment":null,"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|40"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column {"verticalAlignment":"center","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"},"blockGap":"1rem"},"border":{"color":"#2e2e2e","width":"1px"}},"backgroundColor":"charcoal"} -->
		<div class="wp-block-column is-vertically-aligned-center has-border-color has-charcoal-background-color has-background" style="border-color:#2e2e2e;border-width:1px;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)">
			<!-- wp:heading {"level":3,"style":{"typography":{"letterSpacing":"0.12em"}},"textColor":"concrete","fontSize":"medium"} -->
			<h3 class="wp-block-heading has-concrete-color has-text-color has-medium-font-size" style="letter-spacing:0.12em">Off-Peak</h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"style":{"typography":{"fontWeight":"700","lineHeight":"1"}},"textColor":"white","fontSize":"display","fontFamily":"display"} -->
			<p class="has-white-color has-text-color has-display-font-family has-display-font-size" style="font-weight:700;line-height:1">£29<sub>/mo</sub></p>
			<!-- /wp:paragraph -->

			<!-- wp:list {"textColor":"concrete","fontSize":"small"} -->
			<ul class="wp-block-list has-concrete-color has-text-color has-small-font-size">
				<!-- wp:list-item --><li>Open gym 09:00 – 16:00 weekdays</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>Full weekend access</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>2 coached classes per week</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>App booking &amp; programme tracking</li><!-- /wp:list-item -->
			</ul>
			<!-- /wp:list -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button {"textColor":"white","width":100,"className":"is-style-outline"} -->
				<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#contact">Choose Off-Peak</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","className":"repset-tier-featured","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"},"blockGap":"1rem"}},"backgroundColor":"crimson","textColor":"white"} -->
		<div class="wp-block-column is-vertically-aligned-center repset-tier-featured has-white-color has-crimson-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--40)">
			<!-- wp:paragraph {"className":"repset-kicker","fontSize":"small"} -->
			<p class="repset-kicker has-small-font-size">Most popular</p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"level":3,"style":{"typography":{"letterSpacing":"0.12em"}},"fontSize":"medium"} -->
			<h3 class="wp-block-heading has-medium-font-size" style="letter-spacing:0.12em">Unlimited</h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"style":{"typography":{"fontWeight":"700","lineHeight":"1"}},"fontSize":"display","fontFamily":"display"} -->
			<p class="has-display-font-family has-display-font-size" style="font-weight:700;line-height:1">£39<sub>/mo</sub></p>
			<!-- /wp:paragraph -->

			<!-- wp:list {"fontSize":"small"} -->
			<ul class="wp-block-list has-small-font-size">
				<!-- wp:list-item --><li>Open gym — all opening hours</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>Unlimited coached classes</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>Boxing &amp; Olympic Lifting Club included</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>Free guest pass every month</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>Member rates on workshops</li><!-- /wp:list-item -->
			</ul>
			<!-- /wp:list -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button {"backgroundColor":"charcoal","textColor":"white","width":100} -->
				<div class="wp-block-button has-custom-width wp-block-button__width-100"><a class="wp-block-button__link has-white-color has-charcoal-background-color has-text-color has-background wp-element-button" href="#contact">Choose Unlimited</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"},"blockGap":"1rem"},"border":{"color":"#2e2e2e","width":"1px"}},"backgroundColor":"charcoal"} -->
		<div class="wp-block-column is-vertically-aligned-center has-border-color has-charcoal-background-color has-background" style="border-color:#2e2e2e;border-width:1px;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)">
			<!-- wp:heading {"level":3,"style":{"typography":{"letterSpacing":"0.12em"}},"textColor":"concrete","fontSize":"medium"} -->
			<h3 class="wp-block-heading has-concrete-color has-text-color has-medium-font-size" style="letter-spacing:0.12em">All-Access +</h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"style":{"typography":{"fontWeight":"700","lineHeight":"1"}},"textColor":"white","fontSize":"display","fontFamily":"display"} -->
			<p class="has-white-color has-text-color has-display-font-family has-display-font-size" style="font-weight:700;line-height:1">£59<sub>/mo</sub></p>
			<!-- /wp:paragraph -->

			<!-- wp:list {"textColor":"concrete","fontSize":"small"} -->
			<ul class="wp-block-list has-concrete-color has-text-color has-small-font-size">
				<!-- wp:list-item --><li>Everything in Unlimited</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>Monthly 1-to-1 coaching session</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>Personalised programme, reviewed quarterly</li><!-- /wp:list-item -->
				<!-- wp:list-item --><li>InBody scan every 8 weeks</li><!-- /wp:list-item -->
			</ul>
			<!-- /wp:list -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button {"textColor":"white","width":100,"className":"is-style-outline"} -->
				<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#contact">Choose All-Access</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:paragraph {"align":"center","textColor":"concrete","fontSize":"small"} -->
	<p class="has-text-align-center has-concrete-color has-text-color has-small-font-size">Student and NHS discounts available with valid ID. Day pass £12 · 10-visit punch card £90.</p>
	<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
