import React, { Component, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  TouchableHighlight,
  Text,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ImageBackground, Image, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import Timeline from "react-native-timeline-flatlist";
import {
  Appbar,
  Avatar,
  IconButton,
  Button,
  TextInput,
  Divider,
  Chip,
} from "react-native-paper";
import { Rating, AirbnbRating } from "react-native-ratings";
import { FancyAlert } from "react-native-expo-fancy-alerts";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/auth'
const loadingIcon = require("../loadingicon.gif");
const check = require("../img/check.png");
const driver_search = require("../img/find.png");

const MainScreen = ({ route, navigation }) => {
  const { userId, fname, lname, email, contact, address, profile, type } =
    route.params;
  const [createdTrip, setCreatedTrip] = useState(false);
  const [doneBooking, setDoneBooking] = useState(false);
  const [location, setLocation] = useState({
    latitude: 16.322825415621658,
    longitude: 120.36770346587748,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [destination, setDestination] = useState({
    latitude: null,
    longitude: null,
  });
  const [km, setKm] = useState(0);
  const [fare, setFare] = useState(25);
  const [currentBookedId, setCurrentBookedId] = useState("");
  const [hasDriver, setHasDriver] = useState(false);
  const [currentDriverDispatch, setCurrentDriverDispatch] = useState("");
  const [bookAccepted, setBookAccepted] = useState(false);
  const [bookAcceptedById, setBookAcceptedById] = useState("");
  const [bookAcceptedBy, setBookAcceptedBy] = useState("");
  const [checkTrip, setCheckTrip] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [myDriverCoords, setMyDriverCoords] = useState(null)
  const [rate, setRate] = useState(0);
  const [doneRating, setDoneRating] = useState(false);

  /* const origin = { latitude: location.latitude, longitude: location.longitude };
  const GOOGLE_MAPS_APIKEY = "AIzaSyAG9PJlZJXDVrXp0I9rX100yMK4ntnxBgE"; */

  useEffect(() => {
    (async() => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(prevState => ({
        ...prevState,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }));
    })();
  }, []);

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  const signOut = () => {
    /* Speech.speak("Thank your for using fire safety inspection certificate online application. See you again soon"); */
    try {
      firebase.auth().signOut();
      navigation.navigate("SplashScreen");
    } catch (error) {
      console.log(error);
    }
  };


  const pressMap = (coordinate) => {
    setDestination(prevState => ({
      ...prevState,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));

    let km = distance(
      location.latitude,
      location.longitude,
      coordinate.latitude,
      coordinate.longitude
    );
    setKm(km);

    var fare = 25;

    for (var i = 0; i <= km; i++) {
      if (i == 0) {
        setFare(25);
      } else {
        var fare = i * 10 + 15;
      }
    }
    setFare(fare);
  };

  const distance = (lat1, lon1, lat2, lon2, unit) => {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      var radlat1 = (Math.PI * lat1) / 180;
      var radlat2 = (Math.PI * lat2) / 180;
      var theta = lon1 - lon2;
      var radtheta = (Math.PI * theta) / 180;
      var dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit == "K") {
        dist = dist * 1.609344;
      }
      if (unit == "N") {
        dist = dist * 0.8684;
      }
      return dist;
    }
  };

  const bookTrip = () => {
    setBookAcceptedBy("");
    setBookAccepted(false);
    if (destination.latitude !== null && destination.longitude !== null) {
      firebase.firestore().collection("bookings")
        .add({
          createdAt: firebase.firestore.Timestamp.fromDate(new Date()),
          destination: new firebase.firestore.GeoPoint(
            destination.latitude,
            destination.longitude
          ),
          driverId: "",
          driverName: "",
          fare: fare,
          distance: km,
          hasRider: false,
          isDispatch: false,
          origin: new firebase.firestore.GeoPoint(
            location.latitude,
            location.longitude
          ),
          passengerId: userId,
          passengerName: `${fname} ${lname}`,
          status: 1,
          pickupAt: null,
          arrivedAt: null,
          isAccepted: false,
          isRemitted: false,
        })
        .then((docRef) => {
          setCurrentBookedId(docRef.id);
          setDoneBooking(true);
          firebase.firestore().collection("bookings")
            .doc(docRef.id)
            .onSnapshot((doc) => {
              if (doc.data().isAccepted) {
                setBookAccepted(true);
                setHasDriver(true);
                setBookAcceptedById(doc.data().driverId)
                setBookAcceptedBy(doc.data().driverName);
              } else if (doc.data().isDispatch) {
                setCurrentDriverDispatch(doc.data().driverName);
              }
            });
        });
    } else {
      Alert.alert("Please set destination");
    }
  };

  const checkMyTrip = () => {
    setDoneBooking(false);
    setCheckTrip(true);

    // Booking instances
    firebase.firestore().collection("bookings")
      .doc(currentBookedId)
      .onSnapshot((doc) => {
        console.log("STATUS: " + doc.data().status);
        if (doc.data().status == 5) {
          console.log("ARRIVED");
          setCheckTrip(false);
          setShowRating(true);
        }
      });


    // Timeline of bokings instance
    firebase.firestore().collection("bookings")
      .doc(currentBookedId)
      .collection("timeline")
      .onSnapshot((querySnapshot) => {
        const tempArray = querySnapshot.docs.map((documentSnapshot) => {
          return {
            ...documentSnapshot.data(),
          };
        });

        setTimeline(tempArray);
      });


      // Drivers instances
      firebase.firestore().collection("drivers")
      .doc(bookAcceptedById)
      .onSnapshot((doc) => {
        setMyDriverCoords(doc.data().coordinates)
        console.log(doc.data().coordinates)
      });
  };

  const ratingCompleted = (rating) => {
    setRate(rating)
  };

  const saveRating = () => {
    var driversCurrentRatingRef = firebase.firestore().collection("drivers").doc(bookAcceptedById);

    driversCurrentRatingRef.get().then((doc) => {
        if (doc.exists) {
            var finalRate = (doc.data().rate + rate) * 0.5
            // Set the "capital" field of the city 'DC'
            driversCurrentRatingRef 
            .update({
              rate: finalRate,
            })
            .then(() => {
              console.log("Document successfully updated!");
              setDoneBooking(false)
              setKm(0)
              setFare(0)
              setCurrentBookedId("")
              setHasDriver(false)
              setCurrentDriverDispatch("")
              setBookAccepted(false)
              setBookAcceptedBy("")
              setCheckTrip(false)
              setShowRating(false)
              setTimeline([])
              setDoneRating(true)
              setMyDriverCoords(null)
              setDoneRating(false)
              setRate(0)
            })
            .catch((error) => {
              // The document probably doesn't exist.
              console.error("Error updating document: ", error);
            });

        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={
          destination.latitude !== null && destination.longitude !== null
            ? {
                latitude: destination.latitude,
                longitude: destination.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }
            : location
        }
        showsUserLocation={true}
        showsBuildings={true}
        showsTraffic={true}
        showsIndoors={true}
        rotateEnabled={true}
        loadingEnabled={true}
        showsMyLocationButton={false}
        showsCompass={true}
        onPress={(event) => {
          if(!checkTrip) {
            pressMap(event.nativeEvent.coordinate)
          }
        }}
      >
        {destination.latitude !== null && destination.longitude !== null && (
          <Marker
            draggable
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            onDragEnd={(e) => setLatLng(e.nativeEvent.coordinate)}
            title="Destination"
            description="I'm going here!"
          />
        )}
        {myDriverCoords !== null && (
          <Marker
            draggable
            coordinate={{
              latitude: myDriverCoords.latitude,
              longitude: myDriverCoords.longitude,
            }}
            onDragEnd={(e) => setLatLng(e.nativeEvent.coordinate)}
            title="Driver Name"
            description="I am your driver!"
            image={{uri: 'https://i.dlpng.com/static/png/6882551_preview.png'}}
          />
        )}
        {/* <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
        /> */}
      </MapView>
      <View
        style={{
          padding: 25,
          flexDirection: "row",
          justifyContent: "space-between",
          position: "absolute",
          top: 15,
          left: 0,
        }}
      >
        <View style={{ width: "75%" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 5 }}>
            {fname} {lname}
          </Text>
          <Text style={{ fontSize: 12, marginTop: 1 }}>{email}</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "25%",
          }}
        >
          <Avatar.Image
            size={44}
            style={{ marginRight: 10 }}
            source={{
              uri:
                profile !== ""
                  ? profile
                  : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHe330tYy_U_3UN0DmUSbGoFbXigdIQglDAA&usqp=CAU",
            }}
          />
          <View
            style={{
              height: 45,
              width: 45,
              backgroundColor: "white",
              alignItems: "center",
              alignContent: "center",
              borderRadius: 50,
            }}
          >
            <IconButton
              icon="logout"
              color="#05686e"
              size={30}
              onPress={signOut}
              style={{ marginTop: -1, marginLeft: 10 }}
            />
          </View>
        </View>
      </View>
      {!checkTrip && !doneRating ? (
        !showRating ? (
          <>
            <View
              style={{
                backgroundColor: "white",
                height: 170,
                width: "90%",
                position: "absolute",
                bottom: 50,
                borderRadius: 30,
                padding: 20,
              }}
            >
              <View style={{ padding: 7, marginTop: -7 }}>
                <View style={{ flexDirection: "row" }}>
                  <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={15}
                    style={{ marginRight: 5 }}
                    color="black"
                  />
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>Origin: </Text>
                    {`[${location.latitude}, ${location.longitude}]`}
                  </Text>
                </View>
              </View>
              <Divider />
              <View style={{ padding: 7 }}>
                <View style={{ flexDirection: "row" }}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={15}
                    style={{ marginRight: 5 }}
                    color="black"
                  />
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>Destination:</Text>{" "}
                    {destination.latitude !== null &&
                    destination.longitude !== null
                      ? `[${destination.latitude}, ${destination.longitude}]`
                      : "No destination yet"}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row" }}>
                <View
                  style={{
                    padding: 7,
                    width: "50%",
                    flexDirection: "row",
                    alignContent: "space-between",
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker-distance"
                    size={15}
                    style={{ marginRight: 5 }}
                    color="black"
                  />
                  <Text style={{ fontWeight: "bold" }}>Distance:</Text>
                  <Chip
                    onPress={() => alert("AAWF")}
                    style={{ marginTop: -8, marginLeft: 20 }}
                  >
                    {km.toFixed(2)}km
                  </Chip>
                </View>
                <View
                  style={{
                    padding: 7,
                    width: "50%",
                    flexDirection: "row",
                    alignContent: "space-between",
                  }}
                >
                  <MaterialCommunityIcons
                    name="cash"
                    size={15}
                    style={{ marginRight: 5 }}
                    color="black"
                  />
                  <Text style={{ fontWeight: "bold" }}>Fare:</Text>
                  <Chip
                    onPress={() => alert("AAWF")}
                    style={{ marginTop: -8, marginLeft: 20 }}
                  >
                    P{fare}
                  </Chip>
                </View>
              </View>
            </View>
            <Button
              contentStyle={{ height: 50 }}
              labelStyle={{ fontSize: 18 }}
              style={styles.appButtonContainer}
              mode="contained"
              onPress={bookTrip}
            >
              {text === "Waiting.." ? text : "BOOK A TRIP"}
            </Button>
          </>
        ) : (
          <>
            <View
              style={{
                backgroundColor: "white",
                height: 190,
                width: "90%",
                position: "absolute",
                bottom: 50,
                borderRadius: 30,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "bold" }}>
                How's your trip experience?
              </Text>
              <Rating
                showRating
                onFinishRating={ratingCompleted}
                style={{ paddingVertical: 10 }}
              />
            </View>
            <Button
              contentStyle={{ height: 50 }}
              labelStyle={{ fontSize: 18 }}
              style={styles.appButtonContainer}
              mode="contained"
              onPress={saveRating}
            >
              Continue
            </Button>
          </>
        )
      ) : (
        <Timeline
          style={{
            backgroundColor: "white",
            width: "90%",
            position: "absolute",
            bottom: 20,
            borderRadius: 30,
            padding: 20,
          }}
          data={timeline}
        />
      )}
      <FancyAlert
        visible={doneBooking}
        icon={
          <View
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 50,
              width: "100%",
            }}
          >
            <Image
              source={bookAccepted ? check : driver_search}
              style={{ height: 50, width: 50, borderRadius: 50 }}
            />
          </View>
        }
        style={{ backgroundColor: "white" }}
      >
        <Text
          style={{
            marginTop: -16,
            marginBottom: 5,
            fontSize: 14,
            fontWeight: "bold",
            color: "green",
          }}
        >
          {bookAccepted
            ? `Your book is accepted by ${bookAcceptedBy}`
            : "You trip is booked! Please wait to find your driver."}
        </Text>

        {!bookAccepted && (
          <>
            {!bookAccepted && (
              <Text>Dispatching to Rider {currentDriverDispatch}</Text>
            )}
            <Image
              source={loadingIcon}
              style={{ height: 60, width: 90 }}
            ></Image>
          </>
        )}
        {bookAccepted && (
          <Button
            contentStyle={{ height: 50 }}
            labelStyle={{ fontSize: 18 }}
            style={{
              elevation: 4,
              marginTop: 10,
              backgroundColor: "#05686e",
              borderRadius: 25,
              width: "90%",
              height: 50,
              marginBottom: 14,
              fontSize: 25,
            }}
            mode="contained"
            onPress={checkMyTrip}
          >
            Check Trip Status
          </Button>
        )}
      </FancyAlert>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: Dimensions.get("window").width,
    height: '100%',
  },
  appButtonContainer: {
    elevation: 4,
    marginTop: 15,
    backgroundColor: "#05686e",
    borderRadius: 25,
    width: "90%",
    height: 50,
    marginBottom: 14,
    fontSize: 25,
    position: "absolute",
    bottom: 30,
  },
});
