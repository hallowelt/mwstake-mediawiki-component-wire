<?php

use MediaWiki\MediaWikiServices;

if ( defined( 'MWSTAKE_MEDIAWIKI_COMPONENT_WIRE_VERSION' ) ) {
	return;
}

define( 'MWSTAKE_MEDIAWIKI_COMPONENT_WIRE_VERSION', '1.0.0' );

MWStake\MediaWiki\ComponentLoader\Bootstrapper::getInstance()
->register( 'wire', static function () {
	$GLOBALS['mwsgWireServiceUrl'] = '';

	$GLOBALS['wgExtensionFunctions'][] = static function () {
		$hookContainer = MediaWikiServices::getInstance()->getHookContainer();
		$hookContainer->register( 'BeforePageDisplay', static function ( OutputPage $out ) {
			$out->addModules( [ 'mwstake.component.wire' ] );
			$out->addJsConfigVars( 'mwsgWikiServiceUrl', $GLOBALS['mwsgWireServiceUrl'] );
		} );
	};

	$GLOBALS['wgResourceModules']['mwstake.component.wire'] = [
		'scripts' => [
			'resources/bootstrap.js'
		],
		'dependencies' => [
			'mwstake.component.tokenAuthenticator'
		],
		'localBasePath' => __DIR__
	];
} );
