
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Image, Text, View, Linking} from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { createStackNavigator } from '@react-navigation/stack';
import { BaseNavigationContainer, NavigationContainer } from '@react-navigation/native';
import { LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';
LogBox.ignoreLogs(['Setting a timer']);

// Imported Screens
import SplashScreen from './assets/screens/SplashScreen';
import WelcomeBeforeLogin from './assets/screens/WelcomeBeforeLogin'
import SigninScreen from './assets/screens/SigninScreen'
import SignupScreen from './assets/screens/SignupScreen'
import MainScreen from './assets/screens/MainScreen'

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
  }),
});

const App = () => {
  const [notification, setNotification] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log(notification)
    });
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  },[]);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SplashScreen" animation="spring">
          {/* <Stack.Screen name="SpashScreen" component={SplashScreen} options={{ headerShown: false, cardStyleInterpolator: forFade }}/> */}
          <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="WelcomeBeforeLogin" component={WelcomeBeforeLogin} options={{ headerShown: false }}/>
          <Stack.Screen name="SignupScreen" component={SignupScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="SigninScreen" component={SigninScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="MainScreen" component={MainScreen} options={{ headerShown: false }}/>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

