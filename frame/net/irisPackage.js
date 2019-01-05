const websocketStringMessageType = 0;
const websocketIntMessageType = 1;
const websocketBoolMessageType = 2;
const websocketJSONMessageType = 4;
const websocketMessagePrefix = "iris-websocket-message:";
const websocketMessageSeparator = ";";
const websocketMessagePrefixLen = websocketMessagePrefix.length;
const websocketMessageSeparatorLen = websocketMessageSeparator.length;
var websocketMessagePrefixAndSepIdx = websocketMessagePrefixLen + websocketMessageSeparatorLen - 1;
var websocketMessagePrefixIdx = websocketMessagePrefixLen - 1;
var websocketMessageSeparatorIdx = websocketMessageSeparatorLen - 1;
module.exports = {

    isNumber : function (obj) {
        return !isNaN(obj - 0) && obj !== null && obj !== "" && obj !== false;
    },

    isString : function (obj) {
        return Object.prototype.toString.call(obj) == "[object String]";
    },

    isBoolean : function (obj) {
        return typeof obj === 'boolean' ||
        (typeof obj === 'object' && typeof obj.valueOf() === 'boolean');
    },

    isJSON : function (obj) {
        return typeof obj === 'object';
    },

    msg : function (event, websocketMessageType, dataMessage) {
        return websocketMessagePrefix + event + websocketMessageSeparator + String(websocketMessageType) + websocketMessageSeparator + dataMessage;
    },

    encodeMessage : function (event, data) {
        let m = "";
        let t = 0;
        if (this.isNumber(data)) {
            t = websocketIntMessageType;
            m = data.toString();
        }
        else if (this.isBoolean(data)) {
            t = websocketBoolMessageType;
            m = data.toString();
        }
        else if (this.isString(data)) {
            t = websocketStringMessageType;
            m = data.toString();
        }
        else if (this.isJSON(data)) {
            //propably json-object
            t = websocketJSONMessageType;
            m = JSON.stringify(data);
        }
        else if (data !== null && typeof(data) !== "undefined" ) {
            // if it has a second parameter but it's not a type we know, then fire this:
            console.log("unsupported type of input argument passed, try to not include this argument to the 'Emit'");
        }
        return this.msg(event, t, m);
    },

    decodeMessage : function (event, websocketMessage) {
        //iris-websocket-message;user;4;themarshaledstringfromajsonstruct
        let skipLen = websocketMessagePrefixLen + websocketMessageSeparatorLen + event.length + 2;
        if (websocketMessage.length < skipLen + 1) {
            return null;
        }
        let websocketMessageType = parseInt(websocketMessage.charAt(skipLen - 2));
        let theMessage = websocketMessage.substring(skipLen, websocketMessage.length);
        if (websocketMessageType === websocketIntMessageType) {
            return parseInt(theMessage);
        }
        else if (websocketMessageType === websocketBoolMessageType) {
            return Boolean(theMessage);
        }
        else if (websocketMessageType === websocketStringMessageType) {
            return theMessage;
        }
        else if (websocketMessageType === websocketJSONMessageType) {
            return JSON.parse(theMessage);
        }
        else {
            return null; // invalid
        }
    },

    getWebsocketCustomEvent : function (websocketMessage) {
        if (websocketMessage.length < websocketMessagePrefixAndSepIdx) {
            return "";
        }
        let s = websocketMessage.substring(websocketMessagePrefixAndSepIdx, websocketMessage.length);
        let evt = s.substring(0, s.indexOf(websocketMessageSeparator));
        return evt;
    },

    parseReceiveData : function(data){
        if (data.indexOf(websocketMessagePrefix) !== -1) {
            let event_1 = this.getWebsocketCustomEvent(data);
            if (event_1 !== "") {
                let event = event_1;
                let msg = this.decodeMessage(event, data);
                return {
                    event:event,
                    msg:msg
                };
            }
            else{
                return {
                    event:"error",
                    msg:"parseIrisError"
                };
            }
        }
        else{
            return {
                event:"error",
                msg:"parseIrisError"
            };
        }
    }
};