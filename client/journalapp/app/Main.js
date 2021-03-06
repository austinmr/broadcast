import React, { Component } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  ListView,
  View,
  Navigator,
  AsyncStorage,
  Dimensions,
  Image,
  TouchableHighlight, 
  CameraRoll
} from 'react-native';

import Tabs from 'react-native-tabs';
import EntriesTab from './Entry_Components/EntriesTab';
import FriendsTab from './Friend_Components/FriendsTab';
import SettingsTab from './Settings_Components/SettingsTab';
import FriendScene from './Friend_Components/FriendScene';
import MessageScene from './Entry_Components/MessageScene';
import CameraRollScene from './Entry_Components/CameraRollScene';
import SearchFriends from './Friend_Components/SearchFriends';

import Icon from 'react-native-vector-icons/MaterialIcons'

import styles from './styles/MainStyles';

export default class Main extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

    this.state = {
      page: 'EntriesTab',
      entries: ds.cloneWithRows([]),
      newEntry: '',
      friendName: '',
      location: '',
      newImg: ''
    };
  }

  // This is used inside MessageScene, where the user's input updates the Main component's newEntry state.
  // The update occurs here, instead of in MessageScene, so that the "Publish" text's onpress method in 
  // Main can access the new entry and post it to the server. 
  updateEntry(text){
    this.setState({
      newEntry: text
    });
  }

  updateImg(img){
    this.setState({
      newImg: img
    });
    console.log('THIS STATE OF IMAGE:', this.state.newImg)
  }

  updateAudio(audio) {
    this.setState({
      newAudio: audio
    });
  }

  // The friend's name is stored here so that it can be used as a title in the nav bar in Main. The assignment
  // of the name occurs in Friend.js.
  updateFriend(name){
    this.setState({
      friendName: name
    })
  }

  // Use this to keep track of the user's last location.
  watchID: ?number = null;

  // All logic here is grabbed from the testGeo.js file; integrates user's location
  // into the app.
  // NOTE: React Native unfortunately uses navigator as a variable in their geolocation. This does not refer to 
  // the Navigator component, nor an instance of it. 
  componentDidMount() {
    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     var latLng = {lat: position.coords.longitude, lng: position.coords.latitude};
    //     // The GeoCoder needs Xcode configuration to work. For now, use dummy data.
    //     // to establish connection with server. 

    //     // GeoCoder.geocodePosition(latLng)
    //     //   .then( (res) => {
    //     //     this.setState({location: res.locality + ', ' + res.adminArea});
    //     //   })
    //     //   .catch( err => console.log("ERROR: ", err) );

    //     this.setState({location: 'San Francisco, CA'});
    //   },
    //   (error) => alert(JSON.stringify(error)),
    //   {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
    // );
  }

  // These lines clear the location that's being watched when the component unmounts.
  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchID);
  }

  // This method is passed down to EntriesTab.js, where it is used to get the list of all entries for 
  // either the signed in user, when he/she is at his/her profile, or all the entries for a selected friend, 
  // if the user has navigated over to that friend's profile. Note that it will be called on the entry tab's 
  // mount and also after the user makes a new entry (so it'll autorefresh the entry list).
  getEntries(){
    AsyncStorage.getItem('@MySuperStore:token', (err, token) => {
      fetch('https://stark-ravine-57660.herokuapp.com/api/entries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        }
      })
      .then( resp => { resp.json()
        
        .then( json => {
          console.log('json: ', JSON.parse(JSON.stringify(json)))
          const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
          this.setState({
            entries: ds.cloneWithRows(json)
          })
        })
        // .catch((error) => {
        //   console.warn("fetch error on getrequest:", error)
        // });
      });
    });
  }

  // Enter a new entry for the user. This method is here rather than in EntryTab.js so that the user may use the 
  // publish onPress method.
  postEntry(navigator){
    AsyncStorage.getItem('@MySuperStore:token', (err, token) => {
      var imgData = JSON.stringify(this.state.newImg); 
      var newEntry = { text: this.state.newEntry, location: this.state.location };
      var photo = {
        uri: this.state.newImg.uri,
        type: 'image/jpeg',
        name: 'default.jpg'
      }
      var audio = {
        uri: this.state.newAudio,
        type: 'audio/aac',
        name: 'default.aac'
      }
      console.log('audio obj: ', audio);
      var body = new FormData(); 
      body.append('text', newEntry.text); 
      body.append('location', newEntry.location);
      body.append('file', photo); 
      body.append('audio', audio);

      // fetch('http://localhost:3000/api/entries', {
      fetch('https://stark-ravine-57660.herokuapp.com/api/entries', {
        method: 'POST',
        headers: {
         'Content-Type': 'multipart/form-data',
         'x-access-token': token,
         'Parse-Data': false
        },
        body: body
      })
        .then((response) => {
          this.getEntries();
          console.log('RESPONSE TO POST ENTRY IS: ', response); 
          navigator.pop();
        })
          .catch((error) => {
            console.warn("fetch error:", error)
          });
    });
  }

  // According to the state's current page, return a certain tab view. Tab views are all stateful, and will 
  // potentially contain logic to interact with the server, or navigate to scenes using the Navigator. This 
  // is essentially the tab's router.
  renderTab(navigator) {
    if (this.state.page === "EntriesTab") return <EntriesTab
                                                    navigator={navigator}
                                                    getEntries={ this.getEntries.bind(this) }
                                                    entries={ this.state.entries }/>;
    if (this.state.page === "FriendsTab") return <FriendsTab
                                                    navigator={navigator}
                                                    updateFriend={ this.updateFriend.bind(this) }/>;
    if (this.state.page === "SettingsTab") return <SettingsTab
                                                    signOut={ this.props.signOut }/>;
  }

  // This logic applies routing according the title of the current route. It will be activated whenever the 
  // Navigator is altered (via push, pop, etc), will check to see the title of the current route (note that 
  // a Navigator is a stack of scenes, so the current route will be the last route in the stack), and will then 
  // return the appropriate Component(s). 
  navigatorRenderScene(route, navigator) {
    const { page } = this.state;
    if (route.title === 'Main') {
      return (
        <View style={styles.container}>

          {this.renderTab(navigator)}

          <Tabs
            selected={page}
            style={styles.tabbar}
            selectedStyle={{ opacity: 1 }} onSelect={el=>this.setState({page:el.props.name})}>

            <View
              name="EntriesTab"
              style={styles.tabbarView}>
              <Image
                style={styles.tabbarimage}
                source={require('./images/Home_Active.png')}/>
              <Text
                style={styles.tabbartext}>
                Entries</Text>
            </View>

            <View
              name="FriendsTab"
              style={styles.tabbarView}>
              <Image style={styles.tabbarimage} source={require('./images/Friends_Active.png')}/>
              <Text style={styles.tabbartext}>Friends</Text>
            </View>

            <View name="SettingsTab" style={styles.tabbarView}>
              <Image style={styles.tabbarimage} source={require('./images/Settings_Active.png')}/>
              <Text style={styles.tabbartext}>Settings</Text>
            </View>

          </Tabs>
        </View>
      )
    } else if (route.title === 'FriendPage') {
      return (
        <FriendScene
          friendId={ route.friendId }
          navigator={navigator} />
      )
    } else if (route.title === 'MessageScene') {
      return (
        <MessageScene
          navigator={navigator}
          getEntries={ this.getEntries.bind(this) }
          updateEntry = { this.updateEntry.bind(this) }
          updateImg = { this.updateImg.bind(this) }
          updateAudio = { this.updateAudio.bind(this) }
          location={ this.state.location }/>
      )
    } else if (route.title === 'SearchFriends') {
      return (
        <SearchFriends
          navigator={ navigator } />
      )
    } else if (route.title === 'CameraRollScene') {
      return (
        <CameraRollScene
          navigator={navigator} />
      )
  }
}

  // Note that all the Components are enclosed in the navigator. It sets the initial route to Main, 
  // which is then picked up in the navigatorRenderScene routing above, which then renders the view
  // of the main page (including the appropriate tab view, according to the renderTab rendering of 
  // the current tab view);
  render() {
    return (
      <Navigator
        initialRoute={ { title: 'Main' } }
        renderScene={ this.navigatorRenderScene.bind(this) }

        // The navigation bar is the final source of view routing. It only controls the view in the upper
        // nav bar, though note that onPress methods here may interact with the Main state, leading to navigation
        // or server interactions. 
        navigationBar = {
          <Navigator.NavigationBar
            routeMapper={{

              LeftButton(route, navigator, index, navState) {
                if ( route.title === 'FriendPage' || route.title === 'SearchFriends' ){
                  return (
                    <View style={ styles.topBarView }>
                      <Text onPress={ ()=>{ navigator.pop() }} >
                        <Icon style= { styles.arrow } name="chevron-left"/>
                      </Text>
                    </View>
                  )
                } else if ( route.title === 'MessageScene' || route.title === 'CameraRollScene'){
                  return (
                    <View style={ styles.topBarView }>
                      <Text onPress={ ()=>{ navigator.pop() }} >
                        <Icon style= { styles.arrow } name="close"/>
                      </Text>
                    </View>
                  )
                }
              },

              RightButton: (route, navigator, index, navState) => {
                if ( this.state.page === 'FriendsTab' && route.title !== 'SearchFriends' && route.title !== 'FriendPage'){
                  return (
                    <View style={ [styles.topBarView, styles.rightArrow] }>
                      <Text onPress={()=>{ navigator.push({title: 'SearchFriends'}) }} >
                        <Image style={styles.image} source={require('./images/Add_Friend.png')}/>
                      </Text>
                    </View>
                  )
                }
                if ( route.title === 'MessageScene' || route.title === 'CameraRollScene') {
                  return (
                    <View style={ [styles.topBarView, styles.rightArrow] }>
                      <Text style={ [styles.faintText, styles.largerText] } onPress={(() => { this.postEntry(navigator); }).bind(this) } >
                        Publish
                      </Text>
                    </View>
                  );
                }
              },

              Title: (route, navigator, index, navState) =>{
                // Title views for the entries routes.
                if ( route.title === 'MessageScene') {
                  return (<Text style = { [styles.faintText, styles.titleCounter] }>{ 100 - this.state.newEntry.length }</Text>)
                } else if (route.title === 'CameraRollScene') {
                  return (<Text style={ styles.title }>{ 'Select Photo' }</Text>);
                } else if ( this.state.page === 'EntriesTab' ) {
                  return (<Text style={ styles.title }>{ 'BROADCAST' }</Text>);
                } 

                // Title views for the friends routes.
                if ( route.title === 'SearchFriends') {
                  return (<Text style={ styles.title }>{ 'Add Friends' }</Text>);
                } else if ( route.title === 'FriendPage' ) {
                  return (<Text style={ styles.title }>{ this.state.friendName } </Text>);
                } else if ( this.state.page === 'FriendsTab' ) {
                  return (<Text style={ styles.title }>{ 'Friends' }</Text>);
                }

                // Title views for the settings route.
                if (this.state.page === 'SettingsTab') {
                  return (<Text style={ styles.title }>{ 'Settings' }</Text>);
                }

                else {
                  return (<Text style={ styles.title }>{ 'ERROR: We haven\'t covered this route yet.' }</Text>);
                }
              }
            }
          }
          style={ styles.topBar } />
        } />
    )
  }
}



