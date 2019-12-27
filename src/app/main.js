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
                "svg":require('text!assets/svg/brick.svg')
            },
            {
                "name":"red1",
                "svg":require('text!assets/svg/brick.svg')
            },
            {
                "name":"green1",
                "svg":require('text!assets/svg/brick.svg')
            },
            {
                "name":"yellow1",
                "svg":require('text!assets/svg/brick.svg')
            },
            {
                "name":"silver1",
                "svg":require('text!assets/svg/brick.svg')
            },
            {
                "name":"purple1",
                "svg":require('text!assets/svg/brick.svg')
            },       
            {
                "name":"net",
                "svg":require('text!assets/svg/net.svg')
            },       
        ]
    );
    /*
    let elemDiv = document.createElement('div');
    let id = 'd5wZqMCssxw';
    elemDiv.style.display = 'none';
    elemDiv.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}?controls=0&autoplay=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    document.body.appendChild(elemDiv);
    */
    /*
    var mp3 = require('bin!assets/music.mp3');
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function play_mp3(){        
        var source = audioCtx.createBufferSource();
        audioCtx.decodeAudioData(mp3, function(buffer) {
            source.buffer = buffer;
            source.loop = true;
            source.connect(audioCtx.destination);
            source.start(0);
        });
    }
    document.addEventListener('click', function cb(event) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        play_mp3();
    });
    */

});