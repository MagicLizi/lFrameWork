const RNFS = require('react-native-fs');
const FILETYPE = require('./fileType');
const LogUtil = require('../log/logUtil');
import md5 from 'crypto-js/md5';
import { AsyncStorage } from "react-native"
module.exports = {

    fileType: FILETYPE,

    basicPath : RNFS.DocumentDirectoryPath,

    downloadingList:{},

    init: function(){

    },

    getFile: function(uri, type, needCache, cb){
        if(needCache){
            let index= uri.lastIndexOf(".");
            let ext = uri.substr(index+1);
            let folderPath = this.fileFolder(type);
            let filePath =`${folderPath}/${md5(uri)}.${ext}`;
            RNFS.exists(folderPath).then(exist=>{
                if(exist){
                    this.checkFileUri(uri, filePath, cb);
                }
                else{
                    RNFS.mkdir(folderPath).then(()=>{
                        this.checkFileUri(uri, filePath, cb);
                    })
                }
            });
        }
        else{
            cb(uri)
        }
    },

    checkFileUri: function(uri, filePath, cb){
        this.getFileCacheList(uri, exist=>{
            if(exist){
                RNFS.exists(filePath).then(exist=>{
                    if(!exist){
                        LogUtil.info(`file not exist ${filePath}`);
                        this.downloadFile(uri, filePath, ()=>{

                        });
                        cb(uri);
                    }
                    else{
                        LogUtil.info(`file exist ${filePath}`);
                        cb(`file://${filePath}`);
                    }
                });
            }
            else{
                LogUtil.info(`file not exist ${filePath}`);
                this.downloadFile(uri, filePath, ()=>{

                });
                cb(uri);
            }
        });
    },

    fileFolder(type){
        let folderPath = this.basicPath;
        switch (type) {
            case FILETYPE.IMAGE:
                folderPath = folderPath + "/cacheImages";
                break;
        }
        return folderPath;
    },

    downloadFile(uri, filePath, beginCb, progressCb, cb){
        LogUtil.info(`download ${uri} to ${filePath}`);
        RNFS.downloadFile({
            fromUrl:uri,
            toFile:filePath,
            begin:(result)=>{
                this.downloadingList[uri] = result.jobId;
                beginCb&&beginCb(result);
            },
            progress:(result)=>{
                LogUtil.info(`${result.jobId} ${result.contentLength} ${result.bytesWritten}`);
                progressCb&&progressCb(result);
            }
        }).promise.then((result)=>{
            LogUtil.info(`download result ${JSON.stringify(result)}`);
            if(result.statusCode === 200){
                this.addFileCacheList(uri);
            }
            delete this.downloadingList[uri];
            cb&&cb(result);
        }).catch(e=>{
            LogUtil.info(e.toString());
            delete this.downloadingList[uri];
        })
    },

    stopDownLoadFile(uri){
        let jobId = this.downloadingList[uri];
        if(jobId){
            RNFS.stopDownload(jobId);
            delete this.downloadingList[uri];
        }
    },

    addFileCacheList(uri){
        let key = "file_"  + md5(uri).toString();
        AsyncStorage.setItem(key,"exist");
    },

    getFileCacheList(uri, cb){
        let key = "file_" +  md5(uri).toString();
        AsyncStorage.getItem(key,(e,r)=>{
            if(!e&&r){
                cb(true);
            }
            else{
                cb(false);
            }
        })
    },

    deleteFile: function(uri, type, cb){
        let index= uri.lastIndexOf(".");
        let ext = uri.substr(index+1);
        let folderPath = this.fileFolder(type);
        let filePath =`${folderPath}/${md5(uri)}.${ext}`;
        RNFS.unlink(filePath)
            .then(() => {
                cb(true);
            })
            // `unlink` will throw an error, if the item to unlink does not exist
            .catch((err) => {
                LogUtil.info(err.message);
                cb(false);
            });
    },

    deleteFolderByType: function(type, cb){
        let folderPath = this.fileFolder(type);
        RNFS.unlink(folderPath)
            .then(() => {
                cb(true);
            })
            // `unlink` will throw an error, if the item to unlink does not exist
            .catch((err) => {
                LogUtil.info(err.message);
                cb(false);
            });
    }
};