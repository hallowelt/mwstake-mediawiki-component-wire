<?php

namespace MWStake\MediaWiki\Component\Wire\Tests\Unit;

use MediaWiki\Page\PageIdentity;
use MediaWiki\SpecialPage\SpecialPage;
use MediaWiki\User\UserIdentity;
use MediaWikiUnitTestCase;
use MWStake\MediaWiki\Component\Wire\WireChannelFactory;

/**
 * For safe-guarding channel name convention
 * @covers \MWStake\MediaWiki\Component\Wire\WireChannelFactory
 */
class WireChannelFactoryTest extends MediaWikiUnitTestCase {

	/**
	 * @return void
	 */
	public function testGetPageChannel(): void {
		$channelFactory = new WireChannelFactory();
		$page = $this->createMock( PageIdentity::class );
		$page->method( 'getDBkey' )->willReturn( 'Bar' );
		$page->method( 'getNamespace' )->willReturn( 1 );
		$this->assertSame( 'page-1|Bar', (string)$channelFactory->getChannelForPage( $page ) );
	}

	/**
	 * @return void
	 */
	public function testGetSpecialPageChannel(): void {
		$channelFactory = new WireChannelFactory();
		$page = $this->createMock( SpecialPage::class );
		$page->method( 'getName' )->willReturn( 'Bar' );
		$this->assertSame( 'special-Bar', (string)$channelFactory->getChannelForSpecialPage( $page ) );
	}

	/**
	 * @return void
	 */
	public function testGetUserChannel(): void {
		$channelFactory = new WireChannelFactory();
		$user = $this->createMock( UserIdentity::class );
		$user->method( 'getName' )->willReturn( 'Bar' );
		$this->assertSame( 'user-Bar', (string)$channelFactory->getChannelForUser( $user ) );
	}

	/**
	 * @return void
	 */
	public function testGetGlobalChannel(): void {
		$channelFactory = new WireChannelFactory();
		$this->assertSame( 'global', (string)$channelFactory->getGlobalChannel() );
	}
}
