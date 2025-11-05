<?php

namespace MWStake\MediaWiki\Component\Wire\Tests\Unit;

use MediaWiki\Page\PageIdentity;
use MediaWikiUnitTestCase;
use MWStake\MediaWiki\Component\Wire\Listener\WireListener;
use MWStake\MediaWiki\Component\Wire\Listener\WireListenerOnPage;
use MWStake\MediaWiki\Component\Wire\WireChannel;
use MWStake\MediaWiki\Component\Wire\WireListenerRegistry;

/**
 * @covers \MWStake\MediaWiki\Component\Wire\WireListenerRegistry
 */
class WireListenerRegistryTest extends MediaWikiUnitTestCase {

	/**
	 * @param WireListener $listener
	 * @param WireChannel $channel
	 * @param int $expectedCount
	 * @return void
	 * @covers \MWStake\MediaWiki\Component\Wire\WireListenerRegistry::register
	 * @covers \MWStake\MediaWiki\Component\Wire\WireListenerRegistry::getListeners
	 * @dataProvider provideListeners
	 */
	public function testGetListeners( WireListener $listener, WireChannel $channel, int $expectedCount ): void {
		$registry = new WireListenerRegistry(
			[],
			$this->createMock( \MediaWiki\HookContainer\HookContainer::class ),
			$this->createMock( \Wikimedia\ObjectFactory\ObjectFactory::class )
		);

		$registry->register( $listener );
		$this->assertCount( $expectedCount, $registry->getListeners( $channel ) );
	}

	public function provideListeners(): array {
		$specificPage = $this->createMock( PageIdentity::class );
		$specificPage->method( 'getDBkey' )->willReturn( 'Bar' );
		$specificPage->method( 'getNamespace' )->willReturn( 1 );
		$specificPageListener = $this->createMock( WireListenerOnPage::class );
		$specificPageListener->method( 'getPageToListenOn' )->willReturn( $specificPage );
		return [
			'catch-all' => [
				$this->createMock( WireListener::class ),
				new WireChannel( 'global' ),
				1
			],
			'catch-all-for-page' => [
				$this->createMock( WireListener::class ),
				new WireChannel( 'page-1|a' ),
				1
			],
			'page-specific-on-global' => [
				$this->createMock( WireListenerOnPage::class ),
				new WireChannel( 'global' ),
				0
			],
			'page-specific-on-any-page' => [
				$this->createMock( WireListenerOnPage::class ),
				new WireChannel( 'page-1|Foo' ),
				1
			],
			'page-specific-on-specific-page-wrong' => [
				$specificPageListener,
				new WireChannel( 'page-1|Foo' ),
				0
			],
			'page-specific-on-specific-page-correct' => [
				$specificPageListener,
				new WireChannel( 'page-1|Bar' ),
				1
			],
		];
	}
}
