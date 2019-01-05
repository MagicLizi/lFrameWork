const LogUtil = require('../log/logUtil');
const NetState = require('./netState');
const IrisPackage = require('./irisPackage');
const PackageType = require('./packageType');
import {AppState} from 'react-native'
module.exports = {

    CONNECT_EVENT : "CONNECT_EVENT",
    RECONNECT_EVENT : "RECONNECT_EVENT",
    NET_ERROR_EVENT : "NET_ERROR_EVENT",

    ws: null,

    host: "wx://127.0.0.1",

    port: 3000,

    events:[],

    curState: NetState.CLOSED,

    curPackageType: PackageType.IRIS,

    heartBreakConf:null,

    reconnectMaxTime: 10,

    curReconnectTime: 0,

    hasInit: false,

    errorReconnect: false,

    init: function (host, port, packageType) {
       if(!this.hasInit){
           this.hasInit = true;
           this.host = host;
           this.port = port;
           this.curPackageType = packageType;
           this.handler =  (state)=>{
               this.handleAppStateChange(state)
           };
       }
    },

    connect(reconnect){
        this.disconnect();
        this.setCurState(NetState.CONNECTING);
        this.ws = new WebSocket(`${this.host}:${this.port}`);
        this.ws.onopen = ()=>{
            this.onOpen();
            if(reconnect){
                this.dealEvent(this.RECONNECT_EVENT, this.curState);
            }
        };
        this.ws.onmessage = e => {
            this.onMessage(e.data);
        };
        this.ws.onerror = e=>{
            this.onError(e);
            setTimeout(()=>{
                this.tryReconnect();
            },3000)
        };
        this.ws.onclose = e => {
            this.onClose(e);
        };
    },

    disconnect(){
        this.ws&&this.ws.close();
        this.ws = null;
        this.clean();
    },

    handleAppStateChange(nextAppState){
        if(nextAppState === "active" && this.hasInit){
            this.tryBeginHeartBreak();
        }
    },

    clean(){
        AppState.removeEventListener('change', this.handler);
        this.cleanHeartBreak();
        this.ws = null;
    },

    onOpen(){
        LogUtil.info('net connect success!');
        AppState.addEventListener('change', this.handler);
        this.curReconnectTime = 0;
        this.setCurState(NetState.OPEN);
        this.tryBeginHeartBreak();
    },

    onError(e){
        LogUtil.info(`net error ${e.message}`);
        this.disconnect();
    },

    onClose(e){
        LogUtil.info(`net close ${e.code} ${e.reason}`);
        this.setCurState(NetState.CLOSED);
    },

    onMessage(msg){
        LogUtil.info(`receive msg :${msg} type ${this.curPackageType}`);
        if(this.curPackageType === PackageType.IRIS){
            let receiveObj = IrisPackage.parseReceiveData(msg);
            this.dealEvent(receiveObj['event'], receiveObj['msg']);
        }
    },

    on: function(event, cb) {
        if(!this.events[event]){
            this.events[event] = [];
        }
        this.events[event].push(cb);
        return cb;
    },

    fireEvent: function(event, cb) {
        let eventCBS = this.events[event];
        if(eventCBS){
            for(let i = eventCBS.length - 1;i >= 0;i--){
                let ecb = eventCBS[i];
                if(ecb === cb){
                    eventCBS.splice(i, 1);break;
                }
            }
        }
    },

    dealEvent: function(event, msg){
        LogUtil.info(`event callback ${event} ${msg}`);
        let eventCBS = this.events[event];
        if(eventCBS){
            for(let i = 0;i<eventCBS.length;i++){
                eventCBS[i]&&eventCBS[i](msg)
            }
        }
        else{
            LogUtil.info(`not exist event listener ${event}`);
        }
    },

    setCurState(state){
        this.curState = state;
        this.dealEvent(this.CONNECT_EVENT, this.curState);
    },

    send: function(event, data){
        if(this.ws && this.curState === NetState.OPEN){
            if(this.curPackageType === PackageType.IRIS){
                let msg = IrisPackage.encodeMessage(event, data);
                this.ws.send(msg);
                return true;
            }
        }
        else{
            LogUtil.info(`ws state error ${this.curState}`);
            return false;
        }
    },

    setHeartBreak: function(event, msg, interval, timeout){
        this.heartBreakConf = {
            event:event,
            msg:msg,
            interval:interval,
            timeout:timeout
        }
    },

    tryBeginHeartBreak: function(){
        if(this.heartBreakConf){
            this.cleanHeartBreak();
            this.heartCb = this.on(this.heartBreakConf.event, hbMsg=>{
                LogUtil.info(`收到心跳返回 ${hbMsg} 重置超时..并且再次发送`);
                this.heartBreakTimeout&&clearTimeout(this.heartBreakTimeout);
                this.heartBreakTimeout = null;
                this.heartBreakInterval&&clearTimeout(this.heartBreakInterval);
                this.heartBreakInterval = null;
                this.heartBreakInterval = setTimeout(()=>{
                    this.sendHeartBreak();
                },this.heartBreakConf.interval);
            });
            this.sendHeartBreak();
        }
    },

    sendHeartBreak(){
        if(this.heartBreakConf){
            LogUtil.info(`发送心跳`);
            this.heartBreakInterval&&clearTimeout(this.heartBreakInterval);
            this.heartBreakInterval = null;
            this.heartBreakTimeout&&clearTimeout(this.heartBreakTimeout);
            this.heartBreakTimeout = null;
            this.heartBreakTimeout = setTimeout(()=>{
                LogUtil.info(`心跳超时，服务器链接中断，尝试重连`);
                this.tryReconnect();
            },this.heartBreakConf.timeout);
            this.send(this.heartBreakConf.event, this.heartBreakConf.msg);
        }
    },

    cleanHeartBreak: function(){
        this.heartBreakInterval&&clearTimeout(this.heartBreakInterval);
        this.heartBreakInterval = null;
        // this.heartBreakTimeout&&clearTimeout(this.heartBreakTimeout);
        // this.heartBreakTimeout = null;
        if(this.heartBreakConf){
            this.fireEvent(this.heartBreakConf.event, this.heartCb);
        }
    },

    tryReconnect(){
        if(this.curReconnectTime <= this.reconnectMaxTime){
            LogUtil.info(`尝试重连 ${this.curReconnectTime}/${this.reconnectMaxTime}`);
            this.curReconnectTime ++;
            this.connect(true);
        }
        else{
            this.dealEvent(this.NET_ERROR_EVENT, "");
        }
    }

};