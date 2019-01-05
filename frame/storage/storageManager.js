import { AsyncStorage } from "react-native"
const LogUtil = require('../log/logUtil');
module.exports = {
    prefix: "userInfo",

    setInfo:function(uid, key, value, cb){
        let infoKey = `${this.prefix}_${uid}`;
        LogUtil.info(`setinfo ${infoKey}`);
        this.getInfo(infoKey, (e,r)=>{
            if(!e){
                let info = r?JSON.parse(r):{};
                info[key] = value;
                AsyncStorage.setItem(infoKey, JSON.stringify(info), e=>{
                    if(e){
                        cb(false)
                    }
                    else{
                        cb(true);
                    }
                })
            }
            else{
                cb(false);
            }
        });
    },

    getInfo:function(uid, cb){
        let infoKey = `${this.prefix}_${uid}`;
        AsyncStorage.getItem(infoKey, cb);
    },

    getInfoByKey: function(uid, key, cb){
        this.getInfo(uid, (e,r)=>{
            if(e){
                cb(null);
            }
            else{
                if(r){
                    let rObj = JSON.parse(r);
                    cb(rObj[key]);
                }
                else{
                    cb(null);
                }
            }
        })
    }
};