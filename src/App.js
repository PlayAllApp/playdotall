import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import firebase from "firebase";
//import SpotifyPlayer from "react-spotify-player";
import SpotifyPlayer from "react-spotify-web-playback";

//firebase settings
const firebaseConfig = {
  apiKey: "AIzaSyDibjF6hkqRum3c0q4heUJL_OryoBcy3sI",
  authDomain: "playdotall.firebaseapp.com",
  databaseURL: "https://playdotall.firebaseio.com",
  storageBucket: "playdotall.appspot.com",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function App() {
  //getting the token
  const token = window.location.hash.slice(14).split("&")[0];
  const clientId = "f5b9df7177184266a5de8eb2c679b982";
  const redirectUri = "http://localhost:3000/";
  const scopes = [
    "streaming",
    "user-read-email",
    "user-read-private",
    // "user-read-birthdate",
    "user-read-playback-state",
    "user-modify-playback-state",
  ];
  const authEndpoint = "https://accounts.spotify.com/authorize";
  const authURL = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    "%20"
  )}&response_type=token&show_dialog=true`;

  //get device Id of signed in user to make sure it's not Jeff's
  const [deviceId, setDeviceId] = useState();

  //getting room imformation for Jeff
  const jeffDevice = "9a9d99bc0edf67b879a3c01fc70ff7c11f6c3663";
  const partyNameInput = useRef();
  const [partyName, setPartyName] = useState();
  const [trackURI, setTrackURI] = useState();
  const [trackName, setTrackName] = useState();
  const [pause, setPause] = useState();
  const [position, setPosition] = useState();
  const [state, setState] = useState();

  //JEFFS DB DATA
  const [dbPartyName, setdbPartyName] = useState();
  const [dbPause, setdbPause] = useState();
  const [dbPosition, setdbPosition] = useState();
  const [dbURI, setdbURI] = useState();

  //setting up the player
  const playerDiv = useRef();
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    playerDiv.current.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Play.All() Music Player",
        getOAuthToken: (cb) => {
          cb(token);
        },
      });

      // Error handling
      player.addListener("initialization_error", ({ message }) => {
        console.error(message);
      });
      player.addListener("authentication_error", ({ message }) => {
        console.error(message);
      });
      player.addListener("account_error", ({ message }) => {
        console.error(message);
      });
      player.addListener("playback_error", ({ message }) => {
        console.error(message);
      });

      //Player connect success
      player.connect().then((success) => {
        if (success) {
          //returns boolean
          console.log(
            "The Web Playback SDK successfully connected to Spotify!"
          );
        }
      });

      // Ready
      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
      });

      // Not Ready
      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      // Playback status updates
      player.addListener("player_state_changed", (state) => {
        setState(state);
        setTrackURI(state.track_window.current_track.uri);
        // setPause(state.paused);
        // setPosition(state.position);
        // setTrackName(state.track_window.current_track.Name);
      });

      // Connect to the player!
      player.connect();
    };
  }, []);

  useEffect(() => {
    if (deviceId === jeffDevice) {
      const path = `users/${deviceId}`;
      if (state) {
        db.ref(path).set({
          partyname: partyName,
          token: token,
          state: state,
        });
      }
    }
  });

  useEffect(() => {
    const path = `users/${jeffDevice}`;
    db.ref(path).on("value", (snapshot) => {
      let data = snapshot.val() ? snapshot.val() : {};
      let dbData = { ...data };
      let dbPartyName = dbData["partyname"];
      let dbpaused = dbData["state"]["paused"];
      let dbposition = dbData["state"]["position"];
      let dbURI = dbData["state"]["track_window"]["current_track"]["uri"];
      setdbPartyName(dbPartyName);
      setdbPause(dbpaused);
      setdbPosition(dbposition);
      setdbURI(dbURI);
    });
  });

  if (!token) {
    return (
      <div ref={playerDiv}>
        <div className="App">
          <header className="App-header">
            <p>
              Play.All() is a new way to share, discover and listen to music.
              Host a room and share your music with the world. Join a room and
              discover music.
            </p>
            <a href={authURL} target="popup">
              Log in to start
            </a>
          </header>
        </div>
      </div>
    );
  }

  if (!deviceId) {
    return (
      <div ref={playerDiv}>
        <header className="App-header">
          <p>Loading...</p>
        </header>
      </div>
    );
  }

  //IF YOU ARE JEFF
  if (deviceId === jeffDevice && token && !partyName && !trackURI) {
    return (
      <div ref={playerDiv}>
        <header className="App-header">
          <p>
            Welcome to Play.All()! Play some music from your Spotify and share
            it with the world or join a room.
          </p>
          <div className="room-container"></div>
          <label htmlFor="name">Name your PARTAY</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            ref={partyNameInput}
          ></input>
          <button
            onClick={() => {
              setPartyName(partyNameInput.current.value);
            }}
          >
            Start a party!
          </button>
        </header>
      </div>
    );
  } else if (deviceId === jeffDevice && token && partyName && !trackURI) {
    return (
      <div ref={playerDiv}>
        <header className="App-header">
          <h1>Playing at {partyName}</h1>
          <p>
            Go to your Spotify and connect to Play.all() Music Player as a
            device and play!
          </p>
        </header>
      </div>
    );
  } else if (
    deviceId === jeffDevice &&
    token &&
    partyName &&
    trackURI &&
    deviceId
  ) {
    return (
      <div ref={playerDiv}>
        <header className="App-header">
          <h1>Playing at {partyName}</h1>
          <p>Currently Playing...</p>
          <SpotifyPlayer uri={trackURI} theme={"black"} view={"list"} />
        </header>
      </div>
    );
  }

  //IF YOU ARE NOT JEFF
  else if (deviceId !== jeffDevice && token) {
    // if (dbPause) {
    //   return (
    //     <div ref={playerDiv}>
    //       <header className="App-header">
    //         <h1>Room is currently empty</h1>
    //       </header>
    //     </div>
    //   );
    // }
    console.log("AAA", dbPartyName, dbPause, dbPosition, dbURI, token);
    return (
      <div ref={playerDiv}>
        <header className="App-header">
          <h1>Playing at {dbPartyName}</h1>
          <p>Currently Playing...</p>
          <SpotifyPlayer
            offset={dbPosition}
            token={token}
            uris={[dbURI]}
            autoPlay={true}
            play={!dbPause}
            name={"Play.All() Music Player"}
            styles={{
              bgColor: "#333",
              color: "#fff",
              loaderColor: "#fff",
              sliderColor: "#1cb954",
              savedColor: "#fff",
              trackArtistColor: "#ccc",
              trackNameColor: "#fff",
            }}
          />
        </header>
      </div>
    );
  } else {
    alert("Oh no!");
  }
}

export default App;
