define(function(require) {    
    require('css!assets/css/main');    
    require('./game').init(
        [
            {
                "name":"ball",
                "svg":require('text!assets/svg/ball.svg'),
            },
            {
                "name":"player1",
                "svg":require('text!assets/svg/player1.svg')
            },
            {
                "name":"player2",
                "svg":require('text!assets/svg/player2.svg')
            },
            {
                "name":"blue1",
                "svg":require('text!assets/svg/brick-blue.svg')
            },
            {
                "name":"red1",
                "svg":require('text!assets/svg/brick-red.svg')
            },
            {
                "name":"green1",
                "svg":require('text!assets/svg/brick-green.svg')
            },
            {
                "name":"yellow1",
                "svg":require('text!assets/svg/brick-yellow.svg')
            },
            {
                "name":"silver1",
                "svg":require('text!assets/svg/brick-silver.svg')
            },
            {
                "name":"purple1",
                "svg":require('text!assets/svg/brick-purple.svg')
            },       
            {
                "name":"net",
                "svg":require('text!assets/svg/net.svg')
            },       
        ]
    );
});