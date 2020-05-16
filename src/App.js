//TO DISTINGUISH IF YOU ARE A HOSTER OR A LISTENER
//Pull deviceid from the db, if your device id is not one of those, you are a listener
//Change conditionals so the room is empty only if
//Use firebase storage(?) not realtime DB
//generate a unique room key and store all info in there
// only creator can be a host
//do you want to close room automatically or keep it idle?
// you want to enable host to play select and play songs in the browser
//change room is currently empty to song is paused
//add a page where you can choose to be a listener or a host

import React, { useRef, useState, useEffect } from "react";
import useScript from "react-script-hook";
import "./App.css";
import SpotifyPlayer2 from "react-spotify-player";
import SpotifyPlayer from "react-spotify-web-playback";
import db from "./firebaseConfig";
import SpotifyWebApi from "spotify-web-api-node";
import * as spotify from "spotify-web-sdk";

function App() {
  //getting the token
  const token = window.location.hash.slice(14).split("&")[0];
  const clientId = "f5b9df7177184266a5de8eb2c679b982";
  const redirectUri = "http://localhost:3000/";
  //https://playdotall.web.app/
  //http://localhost:3000/
  const scopes = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
  ];
  const authEndpoint = "https://accounts.spotify.com/authorize";
  const authURL = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    "%20"
  )}&response_type=token&show_dialog=true`;

  // console.log("SPOTIFY", spotify);
  // spotify.init({ token: token });
  // spotify
  //   .getCurrentUserProfile()
  //   .then((profile) => console.log("PROFILE", profile));

  //load Spotify SDK script
  const [loading, error] = useScript({
    src: "https://sdk.scdn.co/spotify-player.js",
    onload: () => console.log("Script loaded"),
  });

  // const spotifyApi = new SpotifyWebApi({
  //   clientId: clientId,
  //   redirectUri: redirectUri,
  // });
  // spotifyApi.setAccessToken(token);

  //none || host || listener
  const [usertype, setUsertype] = useState("none");

  //get device Id of signed in user
  const [deviceId, setDeviceId] = useState();

  //getting room imformation for Jeff
  // const jeffDevice = "264b89476d6efa951e3f0651d19b0e2237520b7b";
  // //const jeffDevice = "15669ec91f32ec80c42addf68730189c92e1cdf8";
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
  const [dbTrack, setdbTrack] = useState();
  const [dbAlbumart, setdbAlbumart] = useState();
  const [dbArtist, setdbArtist] = useState();

  const [sdk, setSdk] = useState();

  useEffect(() => {
    async function waitForSpotifyWebPlaybackSDKToLoad() {
      return new Promise((resolve) => {
        if (window.Spotify) {
          resolve(window.Spotify);
        } else {
          window.onSpotifyWebPlaybackSDKReady = () => {
            resolve(window.Spotify);
          };
        }
      });
    }
    (async () => {
      const { Player } = await waitForSpotifyWebPlaybackSDKToLoad();
      console.log("The Web Playback SDK has loaded.");
      const sdk = new Player({
        name: "Play.all() Music Player",
        volume: 0.5,
        getOAuthToken: (callback) => {
          callback(token);
        },
      });
      setSdk(sdk);
      sdk.connect().then((success) => {
        if (success) {
          console.log(
            "The Web Playback SDK successfully connected to Spotify!"
          );
        }
      });
      sdk.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
      });

      sdk.addListener("player_state_changed", (state) => {
        console.log("player state changed", state);
        setState(state);
        setTrackURI(state.track_window.current_track.uri);
        // setPause(state.paused);
        // setPosition(state.position);
        // setTrackName(state.track_window.current_track.Name);
      });
    })();
  }, []);

  useEffect(() => {
    if (state) {
      db.collection("room").doc(deviceId).update({
        state: state,
      });
    }
  }, [state]);

  useEffect(() => {
    const data = db.collection("room");
    data.get().then(function (querySnapshot) {
      const rooms = [];
      if (querySnapshot.size > 0) {
        querySnapshot.docs.forEach((documentSnapshot) => {
          let data = documentSnapshot.data() ? documentSnapshot.data() : {};
          let dbData = { ...data };
          let dbPartyName = dbData["partyname"];
          setdbPartyName(dbPartyName);
          if (dbData["state"]) {
            let dbpaused = dbData["state"]["paused"];
            let dbposition = dbData["state"]["position"];
            let dbURI = dbData["state"]["track_window"]["current_track"]["uri"];
            let dbtrack =
              dbData["state"]["track_window"]["current_track"]["name"];
            let dbArt =
              dbData["state"]["track_window"]["current_track"]["album"][
                "images"
              ][0]["url"];
            let dbArtist =
              dbData["state"]["track_window"]["current_track"]["artists"][0][
                "name"
              ];
            setdbPause(dbpaused);
            setdbPosition(dbposition);
            setdbURI(dbURI);
            setdbTrack(dbtrack);
            setdbAlbumart(dbArt);
            setdbArtist(dbArtist);
          }
        });
      }
    });
  });

  //sign in and get token
  if (!token) {
    return (
      <div>
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

  //get listener type
  else if (token && usertype === "none") {
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <div className="flexbox-container">
              <div>
                <h1>Join a room and listen to music</h1>
                <div
                  className="room"
                  onClick={() => {
                    setUsertype("listener");
                  }}
                >
                  <p>{dbPartyName} is currently playing...</p>
                  <img src={dbAlbumart}></img>
                  <p>
                    {dbTrack} by {dbArtist}
                  </p>
                </div>
              </div>

              <div>
                <h1>Make a room and share music</h1>
                <button
                  onClick={() => {
                    setUsertype("host");
                  }}
                >
                  Share Music
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>
    );
  } else if (usertype === "host") {
    if (!partyName)
      return (
        <div>
          <div className="App">
            <header className="App-header">
              <p>I'm a host</p>
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
              <br></br>
              <button
                onClick={() => {
                  setUsertype("none");
                }}
              >
                Back
              </button>
            </header>
          </div>
        </div>
      );
    if (partyName) {
      // spotifyApi.getMyCurrentPlaybackState({}).then(
      //   function (data) {
      //     // Output items
      //     console.log("Now Playing: ", data.body);
      //   },
      //   function (err) {
      //     console.log("Something went wrong!", err);
      //   }
      // );
      db.collection("room").doc(deviceId).set({
        partyname: partyName,
        token: token,
      });
      return (
        <div>
          <header className="App-header">
            <h1>Playing at {partyName}</h1>
            <p>
              Go to your Spotify and connect to Play.all() Music Player as a
              device and play!
            </p>
            <p>Currently Playing...</p>
            <SpotifyPlayer2 uri={trackURI} theme={"black"} view={"list"} />
          </header>
          <br></br>
          <button
            onClick={() => {
              setUsertype("none");
              //setState("");
            }}
          >
            Back
          </button>
        </div>
      );
    }
    /////LISTENER STARTS HERE///////////
  } else if (usertype === "listener") {
    spotify.startUserPlayback();
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <p>I'm a listener</p>
            <p>
              Paused? {!dbPause}
              <br></br>
              Position: {dbPosition}
              <br></br>
              Track URI: {dbURI}
              <br></br>
            </p>

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

            <button
              onClick={() => {
                setUsertype("none");
              }}
            >
              Back
            </button>
          </header>
        </div>
      </div>
    );
  } else {
    console.log("ERR");
  }

  //   if (!deviceId) {
  //     return (
  //       <div ref={playerDiv}>
  //         <header className="App-header">
  //           <p>Loading...</p>
  //         </header>
  //       </div>
  //     );
  //   }

  //   //IF YOU ARE JEFF
  //   //if (deviceId === jeffDevice && token && !partyName && !trackURI) {
  //   if (token && !partyName && !trackURI) {
  //     return (
  //       <div ref={playerDiv}>
  //         <header className="App-header">
  //           <p>
  //             Welcome to Play.All()! Play some music from your Spotify and share
  //             it with the world or join a room.
  //           </p>
  //           <div className="room-container"></div>
  //           <label htmlFor="name">Name your PARTAY</label>
  //           <input
  //             type="text"
  //             id="name"
  //             name="name"
  //             required
  //             ref={partyNameInput}
  //           ></input>
  //           <button
  //             onClick={() => {
  //               setPartyName(partyNameInput.current.value);
  //             }}
  //           >
  //             Start a party!
  //           </button>
  //         </header>
  //       </div>
  //     );
  //     // } else if (deviceId === jeffDevice && token && partyName && !trackURI) {
  //   } else if (token && partyName && !trackURI) {
  //     db.collection("room").doc(deviceId).set({
  //       partyname: partyName,
  //       token: token,
  //     });
  //     return (
  //       <div ref={playerDiv}>
  //         <header className="App-header">
  //           <h1>Playing at {partyName}</h1>
  //           <p>
  //             Go to your Spotify and connect to Play.all() Music Player as a
  //             device and play!
  //           </p>
  //         </header>
  //       </div>
  //     );
  //     // } else if (
  //     //   deviceId === jeffDevice &&
  //     //   token &&
  //     //   partyName &&
  //     //   trackURI &&
  //     //   deviceId
  //     // ) {
  //   } else if (token && partyName && trackURI && deviceId) {
  //     return (
  //       <div ref={playerDiv}>
  //         <header className="App-header">
  //           <h1>Playing at {partyName}</h1>
  //           <p>Currently Playing...</p>
  //           <SpotifyPlayer2 uri={trackURI} theme={"black"} view={"list"} />
  //         </header>
  //       </div>
  //     );
  //   }

  //   //IF YOU ARE NOT JEFF
  //   // else if (deviceId !== jeffDevice && token) {
  //   //   if (dbPause) {
  //   //     return (
  //   //       <div ref={playerDiv}>
  //   //         <header className="App-header">
  //   //           <h1>Room is currently empty</h1>
  //   //         </header>
  //   //       </div>
  //   //     );
  //   //   }
  //   //   console.log("PAUSED?", dbPause, "POSITION: ", dbPosition, "dbURI: ", dbURI);
  //   //   return (
  //   //     <div ref={playerDiv}>
  //   //       <header className="App-header">
  //   //         <h1>Playing at {dbPartyName}</h1>
  //   //         <p>Currently Playing...</p>
  //   //         <img src={dbAlbumart}></img>
  //   //         <p>
  //   //           {dbTrack} by {dbArtist}
  //   //         </p>
  //   //         <p>
  //   //           Paused? {!dbPause}
  //   //           <br></br>
  //   //           Position: {dbPosition}
  //   //           <br></br>
  //   //           Track URI: {dbURI}
  //   //           <br></br>
  //   //         </p>
  //   //         <SpotifyPlayer
  //   //           offset={dbPosition}
  //   //           token={token}
  //   //           uris={[dbURI]}
  //   //           autoPlay={true}
  //   //           play={!dbPause}
  //   //           name={"Play.All() Music Player"}
  //   //           styles={{
  //   //             bgColor: "#333",
  //   //             color: "#fff",
  //   //             loaderColor: "#fff",
  //   //             sliderColor: "#1cb954",
  //   //             savedColor: "#fff",
  //   //             trackArtistColor: "#ccc",
  //   //             trackNameColor: "#fff",
  //   //           }}
  //   //         />
  //   //       </header>
  //   //     </div>
  //   //   );
  //   //   } else {
  //   //     alert("Oh no!");
  //   //   }
}

export default App;
