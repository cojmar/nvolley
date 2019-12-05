/*jslint browser: true */
define( ['bin'], function( bin ) {
    'use strict';

    /**
     * @type {RegExp}
     */
    var re = /\.mp3$/i;

    return {

        /**
         * @param {string} name
         * @param {function()} require
         * @param {function()} onload
         * @param {Object} config
         */
        load: function( name, require, onload, config ) {
            bin.load( name, require, function( array_buffer ) {
                var context = typeof window.AudioContext === 'function' ?
                    new window.AudioContext() :
                    new window.webkitAudioContext();

                context.decodeAudioData( array_buffer, function( audio_buffer ) {
                    onload( audio_buffer );
                } );
            }, config );
        },

        /**
         * @param {string} name
         * @param {function()} normalize
         * @return {string}
         */
        normalize: function( name, normalize ) {
            if (!re.test( name )) {
                name += '.mp3';
            }

            return normalize( name );
        }
    };
} );
