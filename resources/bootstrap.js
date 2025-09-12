mws = window.mws || {};
mws.wire = {
	_initializing: false,
	_connectionTimer: null,
	_reconnectTimer: null,
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
		if ( mws.wire._initialiting ) {
			return;
		}
		mws.wire._initialiting = true;
		if ( !mws.wire._url ) {
			return null;
		}
		if ( mws.wire.socket ) {
			return;
		}
		mw.loader.using( 'mediawiki.user' ).then( async () => {
			try {
				const token = await mws.tokenAuthenticator.generateToken(true);
				mws.wire.socket = new WebSocket(mws.wire._url + '?token=' + encodeURIComponent(token));
				mws.wire._initialiting = false;
				mws.wire._connectionTimer = setTimeout( () => {
					mws.wire.socket.close();
					mws.wire.socket = null;
					mws.wire._reconnect();
				}, 5000 );
				mws.wire.socket.onopen = () => {
					mws.wire._clearConnectionTimer();
					console.debug( "Wire connection opened" );
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
					mws.wire.socket = null;
					mws.wire._reconnect();
				}
			} catch ( e ) {
				console.error( "Error during wire connection initialization", e ); //eslint-disable-line no-console
			}
		} );
	},
	_reconnect: () => {
		mws.wire._clearConnectionTimer();
		console.debug( "Wire connection lost/cannot connect, attempting to reconnect..." );
		mws.wire._reconnectTimer = setTimeout( () => {
			mws.wire._connect();
		}, 1000 );
	},
	_clearConnectionTimer: () => {
		if ( mws.wire._connectionTimer ) {
			clearTimeout( mws.wire._connectionTimer );
			mws.wire._connectionTimer = null;
		}
		if ( mws.wire._reconnectTimer ) {
			clearTimeout( mws.wire._reconnectTimer );
			mws.wire._reconnectTimer = null;
		}
	},
	listen: async function( channel, callback ) {
		try {
			await mws.wire._checkCurrentUserCanSubscribe( channel );
		} catch ( e ) {
			return;
		}
		mws.wire._connect();
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
