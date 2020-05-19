//generate a unique room key and store all info in there
//do you want to close room automatically or keep it idle?
// you want to enable host to play select and play songs in the browser

import React, { useRef, useState, useEffect } from "react";
import useScript from "react-script-hook";
import "./App.css";
import db from "./firebaseConfig";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function App() {
  //replace with this in the future: https://github.com/spotify/web-api-auth-examples
  const token = window.location.hash.slice(14).split("&")[0];
  const clientId = "f5b9df7177184266a5de8eb2c679b982";
  const redirectUri = "http://localhost:3000/";
  //https://playdotall.web.app/
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

  //load Spotify SDK script
  const [loading, error] = useScript({
    src: "https://sdk.scdn.co/spotify-player.js",
    onload: () => console.log("Script loaded"),
  });

  //user profile
  const [userProf, setUserProf] = useState({});
  //get device Id of signed in user
  const [deviceId, setDeviceId] = useState();
  //none || host || listener
  const [usertype, setUsertype] = useState("none");
  //party name
  const partyNameInput = useRef();
  const [partyName, setPartyName] = useState();
  const [sdk, setSdk] = useState();
  //state
  const [state, setState] = useState({});

  //data from the db
  const [dbPartyName, setdbPartyName] = useState();
  const [dbPause, setdbPause] = useState();
  const [dbPosition, setdbPosition] = useState();
  const [dbURI, setdbURI] = useState();
  const [dbTrack, setdbTrack] = useState();
  const [dbAlbumart, setdbAlbumart] = useState();
  const [dbArtist, setdbArtist] = useState();

  //search states + url
  const SPOTIFY_API_URL = "https://api.spotify.com/v1";
  const [sResults, setSResults] = useState([]); // may need to put a loading time thing for the results since it takes a little time
  const [query, setQuery] = useState(""); // to go forward: figure out how to display the songs/artists when searching
  //when clicking on the song/artist, have that song go into the player
  const [resultsToggle, setResultsToggle] = useState(false);

  const queryHandler = (e) => {
    setQuery(e.target.value);
    searchMusic(query);
  };

  const searchHandler = (e) => {
    e.preventDefault();
    // searchMusic(query)
    setResultsToggle(true);
  };

  const errHandler = (err) => {
    console.log("Unable to load song");
    console.log(err);
  };

  const searchMusic = (q) => {
    return fetch(`${SPOTIFY_API_URL}/search?q=${q}&type=track&limit=10`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        setSResults(res.tracks.items);

        // console.log(res.tracks.items, "IM A RES??")
        console.log(sResults, "IM THE SEARCH RESULTS");
      })
      .catch(errHandler);
  };
  //end of search logic

  useEffect(() => {
    if (token) {
      spotifyWebApi.setAccessToken(token);
      //get information about the user
      spotifyWebApi.getMe().then((res) => {
        setUserProf({
          id: res.id,
          display_name: res.display_name,
          email: res.email,
          // images: res.images[0].url,
        });
      });
    }
  }, []);

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
    })();
  }, []);

  useEffect(() => {
    //many need to add a conditional here
    //get data from the DB
    //if (deviceId && state) {
    const data = db.collection("room");
    data.get().then(function (querySnapshot) {
      querySnapshot.docs.forEach((documentSnapshot) => {
        //documentSnapshot.data() is each document so each room
        let data = documentSnapshot.data() ? documentSnapshot.data() : {};
        let dbData = { ...data };
        setdbPause(dbData.pause);
        setdbPosition(dbData.position);
        setdbURI(dbData.uri);
        setdbTrack(dbData.track);
        setdbAlbumart(dbData.albumart);
        setdbArtist(dbData.artist.name);
        setdbPartyName(dbData.partyname);
      });
    });
    // }
  }, []);

  function playSong() {
    if (!dbPause) {
      console.log("DEVICE ID & TOKEN", deviceId, token);
      console.log("DBURI", dbURI);
      console.log("DBURI", dbPosition);
      console.log("DBPause", dbPause);
      spotifyWebApi.setAccessToken(token);
      spotifyWebApi
        .play({
          device_id: deviceId,
          uris: [dbURI],
          position_ms: dbPosition,
        })
        .then((res) => console.log(res));
    }
  }

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
  else if (usertype === "none") {
    return (
      <div>
        <p>Logged in as {userProf.display_name}</p>
        <div className="flexbox-container">
          <div>
            <h1>Join a room and listen to music</h1>
            <div
              className="room"
              onClick={() => {
                setUsertype("listener");
                userProf["type"] = "listener";
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
                userProf["type"] = "host";
              }}
            >
              Share Music
            </button>
          </div>
        </div>
      </div>
    );
  } else if (usertype === "host") {
    if (!partyName)
      return (
        <div>
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
        </div>
      );
    if (partyName) {
      if (deviceId) {
        db.collection("room").doc(deviceId).set({
          partyname: partyName,
          token: token,
        });
      }

      sdk.addListener("player_state_changed", (state) => {
        setState(state);
        if (deviceId && state) {
          db.collection("room").doc(deviceId).update({
            //db.collection("room").doc(deviceId).update({
            track: state.track_window.current_track.name,
            artist: state.track_window.current_track.artists[0],
            albumart: state.track_window.current_track.album.images[0].url,
            uri: state.track_window.current_track.uri,
            position: state.position,
            pause: state.paused,
          });
        }
        // setNowPlaying({
        //   track: state.track_window.current_track.name,
        //   artist: state.track_window.current_track.artists[0],
        //   albumart: state.track_window.current_track.album.images[0].url,
        //   uri: state.track_window.current_track.uri,
        //   position: state.position,
        //   pause: state.paused,
        // });
        // spotifyWebApi.getMyCurrentPlaybackState().then((res) => {
        //   console.log("getMyCurrentPlaybackState", res);
        // });
      });

      return (
        <div>
          <header className="App-header">
            <h1>Playing at {partyName}</h1>
            <form onSubmit={searchHandler}>
              <input
                type="text"
                onChange={queryHandler}
                placeholder="search for a song"
              ></input>
              <input type="submit" value="search"></input>
            </form>
            <div>
              {sResults !== [] &&
                resultsToggle &&
                sResults.map((track) => (
                  <img
                    src={track.album.images[2].url}
                    onClick={() => {
                      spotifyWebApi.setAccessToken(token);
                      spotifyWebApi.play({
                        device_id: deviceId,
                        uris: [track.uri],
                      });
                    }}
                  ></img>
                ))}
            </div>
            {/* <p>
              Go to your Spotify and connect to Play.all() Music Player as a
              device and play!
            </p>
            <p>Currently Playing...</p> */}
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
  } else if (usertype === "listener") {
    //setPlaySong(true);
    playSong();
    if (dbPause) {
      console.log("PAUSED");
      // spotifyWebApi.setAccessToken(token);
      // spotifyWebApi.pause().then((res) => console.log("pause", res));
    } else if (!dbPause) {
      console.log("IM NOT PAUSED YOU FOO");
    }

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
            <button
              onClick={() => {
                setUsertype("none");
                //setPlaySong(false);
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
}

export default App;

//getting room imformation for Jeff
// const jeffDevice = "264b89476d6efa951e3f0651d19b0e2237520b7b";
// //const jeffDevice = "15669ec91f32ec80c42addf68730189c92e1cdf8";
// const [trackURI, setTrackURI] = useState();
// const [trackName, setTrackName] = useState();
// const [pause, setPause] = useState();
// const [position, setPosition] = useState();

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
