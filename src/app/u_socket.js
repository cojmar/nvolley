(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else return factory()
}(function() {
    let run_mode = {
        main:false,
        use_worker:false,
        worker:false,
    }
    if (typeof(Worker2) !== "undefined") {
        run_mode.use_worker = true;
        try {
            run_mode.main = (typeof window !== 'undefined') ? true : false;
        } catch (error) {
            run_mode.main = false;
        }
        run_mode.worker = (run_mode.main) ? new Worker("app/u_socket.js") : false;
    } else {
        run_mode.main = true;
    }
    //console.log(JSON.stringify(run_mode))
    class u_socket {
        constructor() {
            this.events = {};
            this.server = `ws://${this.getBaseUrl()}:3000`;
            this.connected = false;
            this.keep_alive();
        }
        keep_alive() {
            if (this.keep_alive_interval) clearInterval(this.keep_alive_interval);
            this.keep_alive_interval = setInterval(() => {
                this.send('ping');
            }, 30000);
            return this;
        }
        getBaseUrl() {
            if (!run_mode.main) return false;
            return window.location.href.split('://')[1].split('/')[0];
        }
        emit_event(ev, data) {
            if (!ev) return false;
            if (typeof this.events[ev] !== 'object') return false;
            this.events[ev].forEach(cb => {
                cb(data);
            });
        }
        connect() {
            if (this.connect_timeout) clearTimeout(this.connect_timeout);
            let server = arguments[0] || false;
            if (server) this.server = server;            
            this.init_socket();            
            return this;
        }
        disconnect() {
            if (this.connected) this.socket.close(4666);
            return this;
        }
        on(cmd, call_back) {
            if (!cmd) return this;
            if (typeof call_back !== 'function') return this;
            if (!this.events[cmd]) {
                this.events[cmd] = [];
            }
            this.events[cmd].push(call_back);
            return this;
        }
        init_socket(no_ws=false) {
            this.socket =(no_ws)?{}:new WebSocket(this.server);
            this.socket.on = () => { this.on(arguments) }
            this.socket.onopen = () => {
                this.connected = true;
                this.emit_event('connect', { server: this.server });
            };
            this.socket.onclose = (close_event) => {
                this.connected = false;
                if (close_event.code !== 4666) {
                    if (this.connect_timeout) clearTimeout(this.connect_timeout);
                    this.connect_timeout = setTimeout(() => {
                        this.connect();
                    }, 10000);
                }
                this.emit_event('disconnect', close_event);
            };
            this.socket.onmessage = (message) => {
                let data;
                try {
                    data = JSON.parse(message.data);
                } catch (error) {
                    data = message.data
                }
                this.emit_event(data.cmd, data.data)
            };
            this.socket.send_cmd = (cmd, data) => {
                return this.socket.send({
                    cmd: cmd,
                    data: data
                });
            }
            return this;
        }
        send(data) {
            if (data.cmd === 'connect') return this.connect(data.data);
            if (data.cmd === 'disconnect') return this.disconnect();
            if (!this.connected) return this;
            this.socket.send(JSON.stringify(data));
            return this;
        }
    }    
  
    let network = new u_socket;
    if (!run_mode.main && run_mode.use_worker){
        addEventListener('message',(e)=>{
            let cmd_data = e.data;
            switch(cmd_data.cmd){
                default:                
                    network[cmd_data.cmd](cmd_data.data);
                break;
                case 'on':
                    network.on(cmd_data.data.cmd,(data)=>{
                        cmd_data.data.data = data;
                        postMessage(cmd_data.data);                        
                    });
                break
            }
            //postMessage(cmd_data);
            //console.log(cmd_data);
        })        
        return true;
    }
    
    if (run_mode.main && run_mode.use_worker && run_mode.worker){
        run_mode.worker.onmessage = (e)=>{            
            let data  = e.data;   
            data.cmd = data.cmd || false;
            data.id = data.id || 0;
            cb = network.events[data.cmd][data.id] || false;
            //console.log(data);
            if (cb)cb(data.data);
        }
        network.connect = (data)=>{
            run_mode.worker.postMessage({cmd:'connect',data:data});
            network.init_socket(1);
            return network;
        };
        network.send = (data)=>{
            run_mode.worker.postMessage({cmd:'send',data:data});
            return network;
        };
        network.on = (cmd,call_back)=>{            
            if (!cmd) return network;
            if (typeof call_back !== 'function') return network;
            if (!network.events[cmd]) {
                network.events[cmd] = [];
            }
            run_mode.worker.postMessage({cmd:'on',data:{
                cmd:cmd,
                id:network.events[cmd].length
            }});            
            network.events[cmd].push(call_back);            
            return network;
        };
    }
    window.network = network;
    return network;
}));