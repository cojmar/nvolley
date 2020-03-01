define(function(require) {    
    class u_socket{
        constructor(){
            this.events = {};
            this.server = `ws://${this.getBaseUrl()}:3000`;
            this.connected = false;
            this.keep_alive();
        }
        keep_alive(){
            if (this.keep_alive_interval) clearInterval(this.keep_alive_interval);
            this.keep_alive_interval = setInterval(() => {                
                this.send('ping');                
            }, 30000);
            return this;
        }
        getBaseUrl(){
            return window.location.href.split('://')[1].split('/')[0];
        }
        emit_event(ev,data){
            if(!ev) return false;
            if(typeof this.events[ev] !=='object') return false;
            this.events[ev].forEach(cb => {
                cb(data);
            });            
        }
        connect(){
            if (this.connect_timeout) clearTimeout(this.connect_timeout);
            let server = arguments[0] || false;
            if (server) this.server = server;            
            setTimeout(()=>{
                this.init_socket();
            },500);            
            return this;
        }
        disconnect(){
            if (this.connected) this.socket.close(4666);            
            return this;
        }
        on(cmd,call_back){
            if (!cmd) return this;
            if (typeof call_back !=='function') return this;
            if (!this.events[cmd]){
                this.events[cmd]=[];
            }
            this.events[cmd].push(call_back);
            return this;
        }
        init_socket(){            
            this.socket = new WebSocket(this.server);
            this.socket.on = ()=>{this.on(arguments)}
            this.socket.onopen = () => {            
                this.connected = true;
                this.emit_event('connect',{server:this.server});                
            };
            this.socket.onclose = (close_event) => {
                this.connected = false;
                if (close_event.code !== 4666){
                    if (this.connect_timeout) clearTimeout(this.connect_timeout);
                    this.connect_timeout = setTimeout(() => {
                      this.connect();
                    },10000);
                }
                this.emit_event('disconnect',close_event);
            };
            this.socket.onmessage = (message) => {
                let data;
                try {
                    data = JSON.parse(message.data);
                } catch (error) {
                    data = message.data
                }
                this.emit_event(data.cmd,data.data)                        
            };
            this.socket.send_cmd = (cmd,data) =>{
                return this.socket.send({
                    cmd:cmd,
                    data:data
                });
            }            
            return this;
        }
        send(data){                        
            if (data.cmd ==='connect') return this.connect(data.data);
            if (data.cmd ==='disconnect') return this.disconnect();
            if (!this.connected) return this;
            this.socket.send(JSON.stringify(data));
            return this;
        }
    }
    let network = new u_socket;
    window.network = network;
    return network;
});