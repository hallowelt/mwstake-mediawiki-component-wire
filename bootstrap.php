<?php

if ( defined( 'MWSTAKE_MEDIAWIKI_COMPONENT_WIRE_VERSION' ) ) {
	return;
}

define( 'MWSTAKE_MEDIAWIKI_COMPONENT_WIRE_VERSION', '1.0.0' );

MWStake\MediaWiki\ComponentLoader\Bootstrapper::getInstance()
->register( 'wire', static function () {
	$GLOBALS['mwsgWireMessageListeners'] = [];

	$GLOBALS['wgResourceModules']['mwstake.component.wire'] = [
		'scripts' => [
			'resources/bootstrap.js'
		],
		'localBasePath' => __DIR__
	];
} );
