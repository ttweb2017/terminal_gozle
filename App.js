import React from 'react';
import {Constants, Location, Permissions, Alert, AppLoading } from 'expo';
import {Image, View, TouchableOpacity, Text, Platform, AsyncStorage, ScrollView} from 'react-native';

import ModalSelector from 'react-native-modal-selector'
import Spinner from 'react-native-loading-spinner-overlay';

import ClusteredMapView from 'react-native-maps-super-cluster'
import { Marker, Callout } from 'react-native-maps'


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        data: [],
        location: null,
        loading: false,
        view: "standard"
    };
  }

  initialRegion={
    "latitude": 39.876897491971846,
    "latitudeDelta": 15.250725174119456,
    "longitude": 59.6241013999395,
    "longitudeDelta": 15.191293966037478,
  }

  componentWillMount(){
    this.checkUpdatedData()
    if (Platform.OS === 'android' && !Constants.isDevice) {
      Alert.alert(
        'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
        
      )
    } else {
      this._getLocationAsync();
    }
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }

    let location = await Location.getCurrentPositionAsync({});
    this.initialRegion = this.map.__lastRegion
    this.location = location;
    
    this.forceUpdate()
  };

  changeMapView(){
    // console.log(this.map.getMapRef().__lastRegion)
    if (this.state.view !== "standard"){
      this.setState({view: "standard"})
    }else{
      this.setState({view: "satellite"})
    }
  }

  onClickFilter(opt){
    this.map.getMapRef().animateToRegion(opt.loc)
  }

  getMarkersFromApiAsync() {
    console.log(Date.now().toString())
    fetch('http://terminal.ttweb.org/api/terminal/')
      .then((response) => response.json())
      .then((responseJson) => {
        try {
          AsyncStorage.setItem('dataDate', Math.floor(Date.now()/1000).toString());
          AsyncStorage.setItem('markers', JSON.stringify(responseJson));
        } catch (error) {
          // Error saving data
        }
        this.setState({data: responseJson.map((e, i)=>{e.location={latitude: Number(e.altitude), longitude: Number(e.longtitude)}; return e}), loading: false});
      })
      .catch((error) => {
        this.setState({loading: false})
      });
  }

  getGeo(arr){
    console.log()
    arr.forEach((e, i)=>{
      console.log(e.properties.item.terminal_id)
    })
    console.log()
  }

  async checkUpdatedData(){
    this.setState({loading: true})
    AsyncStorage.getItem('dataDate', (err, res)=>{
      if (!err && res){
        fetch('http://terminal.ttweb.org/api/terminal/check?timestamp='+res)
        .then((response) => response.json())
        .then((responseJson) => {
          if (responseJson.updated)
            this.getMarkersFromApiAsync()
          else{
            AsyncStorage.getItem('markers', (err, res)=>{
              if (!err && res){
                cache = JSON.parse(res);
                this.setState({data: cache.map((e, i)=>{e.location={latitude: Number(e.altitude), longitude: Number(e.longtitude)}; return e}), loading: false});
              }
            });
          }
        })
        .catch((error) => {
          this.setState({loading: false})
        });
      }else{
        this.getMarkersFromApiAsync()
      }
    });
  }

  myCurrentLocation() {
    this._getLocationAsync()
    if (!this.location){
      return
    }

    let tempCoords = {
      latitude: this.location.coords.latitude,
      longitude: this.location.coords.longitude
    }
    this.map.getMapRef().animateToRegion(this.location.coords);
  }

  setCurrentLocMarker(loc){
    this.state.data.push({location: loc, myLoc: true, owner: "Ýerleşýän ýerim", img: "./assets/marker.png"})
    this.setState(this.state)
  }

  render() {
    let map = <ClusteredMapView
                style={{flex: 1}}
                data={this.state.data}
                initialRegion={this.initialRegion}
                ref={(r) => { this.map = r }}
                renderMarker={this.renderMarker}
                renderCluster={this.renderCluster} 
                mapType = {this.state.view} 
                />
    if (this.location) {
      map = (
        <ClusteredMapView
          style={{flex: 1}}
          data={this.state.data}
          initialRegion={this.initialRegion}
          ref={(r) => { this.map = r }}
          renderMarker={this.renderMarker}
          renderCluster={this.renderCluster} 
          mapType = {this.state.view} 
          >
          <Marker coordinate={this.location.coords} style={{zIndex: 100}}>
            <Image
              source={require("./assets/marker.png")}
              style={{width: 30, height: 40, zIndex: 100}}
            />
          </Marker>
        </ClusteredMapView>
      )
    }
    return (
      <View
        style={style.cont}>
        {/* <MapView
          ref={component => this.map = component}
          style={style.map}
          initialRegion={this.initialRegion}
          mapType = {this.state.view} 
        >
          {
            this.state.data.map((e, i)=>
              <MapView.Marker
                key={i}
                coordinate={{latitude: Number(e.altitude), longitude: Number(e.longtitude)}}
                pinColor={e.status==="1" ? "green" : e.status==="0" ? "orange" : "orange"}
              >
                <MapView.Callout>
                  <View>
                      <Text style={style.markerTitle}>{e.owner}</Text>
                      <Text style={style.markerSubTitle}>{e.address}</Text>
                      <Text style={{color: e.status==="1" ? "green" : e.status==="0" ? "orange" : "orange"}}>{e.status==="1" ? "işjeň" : e.status==="0" ? "işjeň däl" : "näbelli"}</Text>
                  </View>
                </MapView.Callout>
              </MapView.Marker>
            )
          }
         
        </MapView> */}

        {map}
        
        <View style={style.imageCont}>
        
          <ModalSelector
            cancelText="Bes etmek"
            optionContainerStyle={{flex: 0, maxWidth: 300, marginLeft: "auto", marginRight: "auto", width: 250}}
            cancelContainerStyle={{flex: 0, maxWidth: 300, marginLeft: "auto", marginRight: "auto", width: 250}}
            data={data}
            ref={selector => { this.selector = selector; }}
            onChange={(option)=>{this.onClickFilter(option)}} 
            customSelector={
              <TouchableOpacity onPress={() => this.selector.open()} style={style.touchable}>
                <Image  style={style.image} source={require('./assets/filter.png')} />
              </TouchableOpacity>    
            }
          />

        </View>    

        <View style={style.viewChangeCont}>
          <TouchableOpacity onPress={()=>this.changeMapView()} style={style.touchable}>
            <Image  style={style.image} source={require('./assets/space_map.png')} />
          </TouchableOpacity>    
        </View> 

        <View style={{...style.viewChangeCont, top: 30}}>
          <TouchableOpacity onPress={()=>this.myCurrentLocation()} style={style.touchable}>
            <Image  style={style.image} source={require('./assets/located.png')} />
          </TouchableOpacity>    
        </View> 

        <Spinner
          visible={this.state.loading}
          textContent={'Ýüklenýär...'}
          textStyle={{color: "#fff"}}
        />

      </View>
    );
  }
  renderCluster = (cluster, onPress) => {
    const pointCount = cluster.pointCount,
          coordinate = cluster.coordinate,
          clusterId = cluster.clusterId

    // use pointCount to calculate cluster size scaling
    // and apply it to "style" prop below

    // eventually get clustered points by using
    // underlying SuperCluster instance
    // Methods ref: https://github.com/mapbox/supercluster
    const clusteringEngine = this.map.getClusteringEngine(),
          clusteredPoints = clusteringEngine.getLeaves(clusterId, 500)

    return (
      <Marker coordinate={coordinate}>
          <View style={style.myClusterStyle}>
            <Text style={style.myClusterTextStyle}>
              {pointCount}
            </Text>
          </View>
        {
          /*
            Eventually use <Callout /> to
            show clustered point thumbs, i.e.:
            <Callout>
              <ScrollView>
                {
                  clusteredPoints.map(p => (
                    <Image source={p.image}>
                  ))
                }
              </ScrollView>
            </Callout>

            IMPORTANT: be aware that Marker's onPress event isn't really consistent when using Callout.
           */
        }
          <Callout style={{maxHeight: 200, width: 120, alignItems: "center"}}>
            <ScrollView>
              {
                clusteredPoints.map((p, i ) => (
                  <Text key={i} style={{color: (p.properties.item.status==1 ? "green" : "orange" )}}>{i+1}. {p.properties.item.terminal_id}</Text>
                ))
              }
            </ScrollView>
          </Callout>
        
      </Marker>
    )
  }
  renderMarker = (data) => (
    <Marker 
      key={data.id || Math.random()} 
      coordinate={data.location} 
      pinColor={data.status==="1" ? "green" : data.status==="0" ? "orange" : "orange"}
    >
      <Callout>
        <View>
            <Text style={style.markerTitle}>{data.owner}</Text>
            <Text style={style.markerSubTitle}>{data.address}</Text>
            <Text style={style.markerSubTitle}>{data.terminal_id}</Text>
            <Text style={{color: data.status==="1" ? "green" : data.status==="0" ? "orange" : "orange"}}>{data.status==="1" ? "işjeň" : data.status==="0" ? "işjeň däl" : "näbelli"}</Text>
        </View>
      </Callout>
    </Marker>
  )
}

const data = [
  { key: 0, section: true, label: 'Ýeri saýlaň' },
  { key: 1, label: 'Balkan', zoom: 7, loc: { latitude: 39.935362, longitude: 54.912013, latitudeDelta: 5, longitudeDelta: 3 }},
  { key: 2, label: 'Ahal', zoom: 7, loc: { latitude: 38.839561, longitude: 58.860998, latitudeDelta: 5, longitudeDelta: 3 }},
  { key: 3, label: 'Mary', zoom: 7, loc: { latitude: 37.604699, longitude: 61.846276, latitudeDelta: 5, longitudeDelta: 3 }},
  { key: 4, label: 'Lebap', zoom: 7, loc: { latitude: 38.813115, longitude: 63.051339, latitudeDelta: 5.5, longitudeDelta: 3 }},
  { key: 5, label: 'Daşoguz', zoom: 7, loc: { latitude: 41.386199, longitude: 58.558616, latitudeDelta: 5, longitudeDelta: 3 }},
  { key: 6, label: 'Aşgabat', zoom: 13, loc: { latitude: 37.925366, longitude: 58.390313, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
];

const style = {
  cont: {
    flex: 1,
    flexDirection: 'row',
    height: "100%",
  },
  map: {
    flex: 1
  },
  imageCont: {
    position: "absolute",
    width: 40,
    height: 40,
    right: 0,
    marginRight: 10,
    marginTop: 130,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 3,
  },
  image: {
    width: 20,
    height: 20,
    margin: 10
  },
  viewChangeCont: {
    position: "absolute",
    width: 40,
    height: 40,
    right: 10,
    top: 80,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 3,
  },
  marker: {
    width: 30,
    height: 40
  },
  markerTitle: {
    fontWeight: "bold"
  },
  markerSubTitle: {
    color: "#888"
  },
  myClusterStyle: {
    height: 50,
    width: 50,
    borderRadius: 50,
    backgroundColor: "#578953",
  },
  myClusterTextStyle: {
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    marginTop: 12,
    fontWeight: "bold"

  }
}