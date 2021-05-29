(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else return factory()
}(function() {
	let run_mode = {
		main: false,
		use_worker: false,
		worker: false,
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
			this.use_shared_objects = true; //if true generates/updates room and me shared_objects from server
			this.use_workers = false; //To do
			this.socket = {
				on: () => { this.on(arguments) },
				send: (data) => { if (this.ws) this.ws.send(data) },
				send_cmd: () => { this.send_cmd(arguments) },
				close: () => { if (this.ws) this.ws.close() }
			}
			this.events = {};
			this.server = `ws://${this.getBaseUrl()}:3000`;
			this.connected = false;
			this.last_on_set = Math.floor(Date.now() / 1000);
			this.keep_alive();
		}
		do_merge(data1, data2) {
			var ret = false;
			if (typeof data1 !== 'object' || typeof data2 !== 'object') {
				data1 = data2;
				return true;
			}
			for (var n in data2) {
				if (!data1[n]) {
					data1[n] = data2[n];
					if (!ret) ret = true;
				} else {
					if (typeof data1[n] === 'object' && typeof data2[n] === 'object') {
						var ret2 = this.do_merge(data1[n], data2[n]);
						if (!ret) ret = ret2;
					} else {
						data1[n] = data2[n];
						if (!ret) ret = true;
					}
				}
			}
			return ret;
		}
		keep_alive() {
			if (this.keep_alive_interval) clearInterval(this.keep_alive_interval);
			this.keep_alive_interval = setInterval(() => {
				this.send('ping');
			}, 30000);
			return this;
		}
		getBaseUrl() {
			if (typeof run_mode !== 'undefined') {
				if (!run_mode.main) return false;
			}
			if (typeof window === 'undefined') return 'localhost';
			return window.location.href.split('://')[1].split('/')[0];
		}
		map_room(ev, data) {
			switch (ev) {
				case 'room.info':
					this.room = data
					break
				case 'my.info':
				case 'auth.info':
					this.me = data;
					break
				case 'room.user_join':
					if (data.user && this.room && data.room && this.room.room === data.room) {
						if (data.user === this.room.me) return false;
						this.room.users[data.user] = data.data;
					}
					break
				case 'room.user_leave':
					if (data.user && this.room && data.room && this.room.room === data.room) {
						if (this.room.users[data.user]) delete this.room.users[data.user];
					}
					break
				case 'room.user_data':
					if (data.user && this.room && this.room.users[data.user]) {
						this.do_merge(this.room.users[data.user].data, data.data);
						if (data.user === this.room.me && this.me) this.do_merge(this.me.data, data.data);
					}
					break
				case 'room.data':
					if (this.room && this.room.name === data.room) {
						this.do_merge(this.room.data, data.data);
					}
					break
			}
			return true;
		}
		strip_html(str) {
			return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/(<([^>]+)>)/gi, '');
		}
		emit_event(ev, data) {
			if (!ev) return false;
			if (ev === 'room.msg' && data.msg) {
				data.msg = this.strip_html(data.msg);
				if (data.msg.trim() === '') return false
			}
			if (!this.map_room(ev, data)) return false;
			if (typeof this.events['cmd'] === 'object') this.events['cmd'].forEach(cb => {
				cb({ cmd: ev, data: data });
			});
			if (typeof this.events[ev] === 'object') this.events[ev].forEach(cb => {
				cb(data);
			});

		}
		connect() {
			let server = arguments[0] || false;
			if (server) this.server = server;
			if (this.socket.close) this.socket.close(4666);
			if (this.connect_timeout) clearTimeout(this.connect_timeout);
			let last_on = Math.floor(Date.now() / 1000) - this.last_on_set;
			if (last_on < 2) {
				this.connect_timeout = setTimeout(() => {
					this.connect();
				});
				return this;
			}
			this.connect_socket();
			return this;
		}
		disconnect() {
			if (this.connected) this.socket.close(4666);
			return this;
		}
		on(cmd, call_back) {
			this.last_on_set = Math.floor(Date.now() / 1000);
			if (!cmd) return this;
			if (typeof call_back !== 'function') return this;
			if (!this.events[cmd]) {
				this.events[cmd] = [];
			}
			this.events[cmd].push(call_back);
			return this;
		}
		connect_socket(no_ws = false) {
			this.ws = new WebSocket(this.server);
			if (typeof BSON !== 'undefined') this.ws.binaryType = "arraybuffer"
			this.ws.onopen = () => {
				this.connected = true;
				this.emit_event('connect', { server: this.server });
			};
			this.ws.onclose = (close_event) => {
				this.connected = false;
				if (close_event.code !== 4666) {
					if (this.connect_timeout) clearTimeout(this.connect_timeout);
					this.connect_timeout = setTimeout(() => {
						this.connect();
					}, 10000);
				}
				this.emit_event('disconnect', close_event);
			};
			this.ws.onmessage = (message) => {
				let data;

				try {
					data = (this.ws.binaryType && this.ws.binaryType === 'arraybuffer') ? BSON.deserialize(message.data) : JSON.parse(message.data);
				} catch (error) {
					data = message.data
				}
				this.emit_event(data.cmd, data.data)
			};
			return this;
		}
		send(data) {
			if (data.cmd === 'connect') return this.connect(data.data);
			if (data.cmd === 'disconnect') return this.disconnect();
			if (!this.connected) return this;
			this.socket.send((this.ws.binaryType && this.ws.binaryType === 'arraybuffer') ? BSON.serialize(data) : JSON.stringify(data));
			return this;
		}
		send_cmd(cmd, data) {
			return this.send({
				cmd: cmd,
				data: data
			});
		}
	}

	let network = new u_socket;
	if (!run_mode.main && run_mode.use_worker) {
		addEventListener('message', (e) => {
			let cmd_data = e.data;
			switch (cmd_data.cmd) {
				default: network[cmd_data.cmd](cmd_data.data);
				break;
				case 'on':
						network.on(cmd_data.data.cmd, (data) => {
						cmd_data.data.data = data;
						postMessage(cmd_data.data);
					});
					break
			}
			//postMessage(cmd_data);
			//console.log(JSON.stringify( cmd_data));
		})
		return true;
	}

	if (run_mode.main && run_mode.use_worker && run_mode.worker) {
		run_mode.worker.onmessage = (e) => {
			let data = e.data;
			data.cmd = data.cmd || false;
			data.id = data.id || 0;
			cb = network.events[data.cmd][data.id] || false;
			//console.log(data);
			if (cb) cb(data.data);
		}
		network.connect = (data) => {

			setTimeout(() => {
				run_mode.worker.postMessage({ cmd: 'connect', data: data });
			}, 500);
			return network;
		};
		network.send = (data) => {
			run_mode.worker.postMessage({ cmd: 'send', data: data });
			return network;
		};
		network.on = (cmd, call_back) => {
			if (!cmd) return network;
			if (typeof call_back !== 'function') return network;
			if (!network.events[cmd]) {
				network.events[cmd] = [];
			}
			run_mode.worker.postMessage({
				cmd: 'on',
				data: {
					cmd: cmd,
					id: network.events[cmd].length
				}
			});
			network.events[cmd].push(call_back);
			return network;
		};

		network.connect_socket(1);
		network.socket.on = () => { network.on(arguments) }
	}
	if (typeof window !== 'undefined') window.u_network = network;
	return network;
}));