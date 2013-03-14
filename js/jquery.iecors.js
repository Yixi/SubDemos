(function( jQuery ) {

  jQuery.ajaxSettings.xdr = function() {
    return (window.XDomainRequest ? new window.XDomainRequest() : null);
  };
  
  (function( xdr ) {
    jQuery.extend( jQuery.support, { iecors: !!xdr });
  })( jQuery.ajaxSettings.xdr() );
  if ( jQuery.support.iecors ) {
    jQuery.ajaxTransport(function( s ) {
      var callback;
      return {
        send: function( headers, complete ) {
          var xdr = s.xdr();
          xdr.onload = function() {
            var headers = { 'Content-Type': xdr.contentType };
            complete(200, 'OK', { text: xdr.responseText }, headers);
          };
					if ( s.xhrFields ) {
            xhr.onerror = s.xhrFields.error;
            xhr.ontimeout = s.xhrFields.timeout;
					}
          xdr.open( s.type, s.url );
          xdr.send( ( s.hasContent && s.data ) || null );
        },

        abort: function() {
          xdr.abort();
        }
      };
    });
  }
})( jQuery );