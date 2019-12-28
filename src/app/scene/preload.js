define(function(require) {
    var Phaser = require('phaser');    
    class preloadScene extends Phaser.Scene {
        constructor(game_assets) {            
            super({
                key: 'preloader'
            })
            this.game_assets = game_assets;
        }
        preload()
        {
            this.load.svg('favicon', 'favicon.ico');
            for (var n in this.game_assets){
            this.svg2texture(this.game_assets[n].name, this.game_assets[n].svg,this);
            }
        }
        svg2texture(key, svg_text,ctx) {            
            var svg_image = new Image()
            svg_image.onload = function(){
                ctx.textures.addImage(key, svg_image)        
            }
            svg_image.src = 'data:image/svg+xml,' + encodeURIComponent(svg_text)            
        }
        create() {             
            this.scene.start('my_game');
            this.scene.run('menu');
        }
    }
    return {
        init:function(game_assets){
            return new preloadScene(game_assets);
        }
    };
});