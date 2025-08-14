mws = window.mws || {};
mws.wire = {
	_isInitialized: false,
	_subscriptions: {},
	_url: mw.config.get( 'mwsgWikiServiceUrl' ),
	_connect: async () => {
		mws.wire._isInitialized = true;
		if ( !mws.wire._url ) {
			return null;
		}
		const token = await mws.tokenAuthenticator.generateToken( true );
		mws.wire.socket = new WebSocket( mws.wire._url + '?token=' + encodeURIComponent( token ) );
		mws.wire.socket.onopen = () => {
			console.debug( "Wire connection established." );
		};
		mws.wire.socket.onmessage = ( event ) => {
			console.log( event );
		};
		mws.wire.socket.onclose = () => {
			console.debug( "Wire connection closed." );
		}
	},
	listen: function( channel, callback ) {
		if ( !mws.wire._isInitialized ) {
			mws.wire._connect();
		}
		if ( !mws.wire._subscriptions[channel] ) {
			mws.wire._subscriptions[channel] = [];
		}
		this._subscriptions[channel].push( callback );
	}
};

mws.wire.listen( 'global', function( data ) {
	console.log( data );
} );