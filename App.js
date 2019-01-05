/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform,StyleSheet, Image, Text, View, TouchableOpacity} from 'react-native';

const NetWorkManager = require('./frame/net/netWorkManager');
const PackageType = require('./frame/net/packageType');
const NetState = require('./frame/net/netState');
const FileManager = require('./frame/file/fileManager');
const StorageManager = require('./frame/storage/storageManager');
const instructions = Platform.select({
    ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
    android:
        'Double tap R on your keyboard to reload,\n' +
        'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {

    constructor(props) {
        super(props);

        this['state'] = {
            connect: false,
            imageUrl:'http://magiclizi.b0.upaiyun.com/test1.jpeg',
            receiveMsg:''
        }
    }

    componentDidMount() {

        NetWorkManager.init("ws://172.26.192.162", 6900, PackageType.IRIS);
        NetWorkManager.setHeartBreak("heartbreak","hb",60000,2000);
        NetWorkManager.errorReconnect = true;
        NetWorkManager.on(NetWorkManager.RECONNECT_EVENT, state => {
            console.log(`reconnect ${state}`)
        });
        NetWorkManager.on(NetWorkManager.CONNECT_EVENT, state => {
            if(state === NetState.OPEN){
                this.setState({connect: true});
            }
            else{
                this.setState({connect: false});
            }
        });

        this.cb = NetWorkManager.on('test', msg => {
            this.setState({receiveMsg:msg})
        });
        // NetWorkManager.fireEvent('test',this.cb);
    }

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={() => {
                    if (!this.state.connect) {
                        NetWorkManager.connect();
                    }
                    else {
                        NetWorkManager.disconnect();
                    }
                }} style={{
                    width: 100,
                    height: 30,
                    backgroundColor: 'gray',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Text style={{color: 'white'}}>{this.state.connect ? "disconnect" : "connect"}</Text>
                </TouchableOpacity>


                <TouchableOpacity onPress={() => {
                    NetWorkManager.send("test", "1");
                }} style={{
                    width: 100,
                    height: 30,
                    backgroundColor: 'gray',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20
                }}>
                    <Text style={{color: 'white'}}>send</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                    StorageManager.setInfo("lizilizi", "test", {a:1}, (success)=>{
                        console.log(success);
                    })
                }} style={{
                    width: 100,
                    height: 30,
                    backgroundColor: 'gray',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20
                }}>
                    <Text style={{color: 'white'}}>存储信息</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                    StorageManager.getInfoByKey("lizilizi", "test", (info)=>{
                        console.log(info);
                    })
                }} style={{
                    width: 100,
                    height: 30,
                    backgroundColor: 'gray',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20
                }}>
                    <Text style={{color: 'white'}}>读取信息</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                    FileManager.deleteFile("http://magiclizi.b0.upaiyun.com/test.jpg",FileManager.fileType.IMAGE,(r)=>{
                        console.log(`delete file result ${r}`);
                    })
                }} style={{
                    width: 100,
                    height: 30,
                    backgroundColor: 'gray',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20
                }}>
                    <Text style={{color: 'white'}}>删除文件</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                    FileManager.getFile("http://magiclizi.b0.upaiyun.com/test.jpg",FileManager.fileType.IMAGE,true,(r)=>{
                        this.setState({imageUrl:r});
                    })
                }} style={{
                    width: 100,
                    height: 30,
                    backgroundColor: 'gray',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20
                }}>
                    <Text style={{color: 'white'}}>查看文件</Text>
                </TouchableOpacity>

                <Image
                    style = {{width:200,height:60,marginTop:20}}
                    source = {{uri:this.state.imageUrl}}
                />

                <Text style = {styles.welcome}>当前收到消息:{this.state.receiveMsg}</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    welcome: {
        fontSize: 16,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});
