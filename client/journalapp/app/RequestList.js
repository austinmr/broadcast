import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  ListView,
  View
} from 'react-native';

import Request from './Request';

var RequestList = (props) => {
  if (props.requestList.length > 0){

    return (

      <View>
      <Text>Pending Friend Requests</Text>
        { props.requestList.map( (request) => {
          return ( <Request fullname={ request.user.fullname } requestId={request.id} acceptFriend={props.acceptFriend} navigator={props.navigator}/> );
        }) }

      </View>

    )
  } else {
    return(
      <View></View>
      )
  }
};

module.exports = RequestList;