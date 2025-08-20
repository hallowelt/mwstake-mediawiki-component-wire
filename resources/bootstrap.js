mws = window.mws || {};
mws.wire = {
	_isInitialized: false,
	_isOpen: false,
	_subscriptions: {},
	_url: mw.config.get( 'mwsgWireServiceWebsocketUrl' ),
	_parseMessage: ( message ) => {
		return mw.msg( ...message )
	},
	_checkCurrentUserCanSubscribe: async ( channel ) => {
		return mws.wire._request( '/mws/v1/wire/check-can-subscribe', {
			channel: channel
		} );
	},
	_request: async ( path, data ) => {
		const dfd = $.Deferred();
		$.ajax( {
			url: mw.util.wikiScript( 'rest' ) + path,
			type: 'POST',
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			data: JSON.stringify( data )
		} ).done( ( data ) => {
			if ( data && data.value ) {
				dfd.resolve();
			} else {
				dfd.reject();
			}
		} ).fail( ( jqXHR, textStatus, errorThrown ) => {
			dfd.reject( errorThrown );
		} );

		return dfd.promise();
	},
	_connect: async () => {
		const dfd = $.Deferred();
		mws.wire._isInitialized = true;
		if ( !mws.wire._url ) {
			return null;
		}
		mw.loader.using( 'mediawiki.user' ).then( async () => {
			if ( mw.user.isAnon() ) {
				return null;
			}
			const token = await mws.tokenAuthenticator.generateToken(true);
			mws.wire.socket = new WebSocket(mws.wire._url + '?token=' + encodeURIComponent(token));
			mws.wire.socket.onopen = () => {
				console.debug( "Wire connection opened" );
				mws.wire._isOpen = true;
				dfd.resolve();
			};
			mws.wire.socket.onmessage = (event) => {
				const wireMessage = mws.wire.Message.fromData( event.data );
				console.debug( "Received wire message:", wireMessage.toJSON() );
				const channel = wireMessage.channel;
				const subscriptions = mws.wire._subscriptions[channel] || [];
				for ( const callback of subscriptions ) {
					try {
						callback( wireMessage.payload );
					} catch (e) {
						console.error( "Error in wire message callback for channel:", channel, e ); //eslint-disable-line no-console
					}
				}
			};
			mws.wire.socket.onclose = () => {
				console.debug( "Wire connection closed" );
				mws.wire._isOpen = false;
			}
		} );
		return dfd.promise();
	},
	listen: async function( channel, callback ) {
		try {
			await mws.wire._checkCurrentUserCanSubscribe( channel );
		} catch ( e ) {
			return;
		}
		if ( !mws.wire._isInitialized ) {
			await mws.wire._connect();
		}
		if ( !mws.wire._isOpen ) {
			throw new Error( 'Wire connection cannot be opened' );
		}
		if ( !mws.wire._subscriptions[channel] ) {
			mws.wire._subscriptions[channel] = [];
		}
		this._subscriptions[channel].push( callback );
	},
	getGlobalChannel: function() {
		return 'global';
	},
	getCurrentPageChannel: function() {
		const namespaceId = mw.config.get( 'wgNamespaceNumber' );
		if ( namespaceId === -1 ) {
			return 'special-' + mw.config.get( 'wgCanonicalSpecialPageName' );
		}
		return 'page-' +
			mw.config.get('wgNamespaceNumber' ) +
			'|' +
			mw.config.get( 'wgTitle' ).replace( ' ', '_' );
	},
	getUserChannel: function( userName ) {
		if ( !userName ) {
			userName = mw.config.get( 'wgUserName' ) || 'anonymous';
		}
		return 'user-' + userName;
	},
	send: function( wireMessage ) {
		return mws.wire._request( '/mws/v1/wire/send', wireMessage.toJSON() );
	}
};
