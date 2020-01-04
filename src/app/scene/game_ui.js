define(function(require) {
    var Phaser = require('phaser');
    class gameUiScene extends Phaser.Scene {
        constructor() {
            super({
                key: 'game_ui'
            })
            this.net = Phaser.net;
        }
        init() {
        }
        update(){
            this.status = 'lobby';
            if (this.net.game) this.status = this.net.game.status;

            if (this.status !== this.old_status){
                this.old_status = this.status;
                if (this.status ==='pending'){
                    this.game_url.text = '[click to copy] '+window.location.href;
                }

                for (let n in this.groups){
                    if (n !==this.status) this.hide_group(this.groups[n]);
                    else this.show_group(this.groups[n]);
                }
            }
            
            
        }
        set_group_visibility(group,visibility){
            if (!visibility) visibility = false;
            var items = group.getChildren();
            for (var n in items){               
                var item = items[n];
                item.visible = visibility;
            }
        }
        hide_group(group){
            this.set_group_visibility(group,false);
        }
        show_group(group){
            this.set_group_visibility(group,true);
        }
        copy_to_clip(text){            
            var textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position="fixed";  //avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            let ret = false; 
            try {
                ret = document.execCommand('copy')?true:false;
            } catch (err) {
                ret = false;
            }            
            document.body.removeChild(textArea);
            return ret;
        }
        create(){
            this.scene.setVisible(false);
            this.groups = {
                'pending':this.add.group(),
                'lobby':this.add.group(),
            }
            this.groups['lobby'].add(this.add.rectangle(400, 200, 800, 300, 0x2A2A55));    
            this.groups['pending'].add(this.add.rectangle(400, 200, 800, 300, 0x2A2A55));
            this.groups['pending'].add(this.add.text(300, 80, "Waiting for players", 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"25px",
                color:"#395fa4"
            }));
            this.groups['pending'].add(this.add.text(10, 130, "Game Url:", 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"18px",
                color:"#395fa4"
            }));
            this.game_url = this.add.text(10, 150, "", 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"12px",
                color:"#395fa4"
            });
            this.game_url.setInteractive({ useHandCursor: true }).
            on("pointerup", () => {                
                if(this.copy_to_clip(window.location.href))
                {
                    this.game_url.setColor('#53ce0c'); 
                }
            })
            .on("pointerover", () => {                    
                this.game_url.setColor('#fff');                    
            })
            .on("pointerout", () => {
                this.game_url.setColor('#395fa4');                     
            });

            this.groups['pending'].add(this.game_url);                    
            this.hide_group(this.groups.pending);
        }
    }
    return gameUiScene;
});