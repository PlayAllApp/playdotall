//add a listener collection
//only read the position when listener gets added to the db
//display how many listeners there are in the host room
//delete document when host leaves the room

import React, { useRef, useState, useEffect } from "react";
import useScript from "react-script-hook";
import "./App.css";
import Animate from "./Animate.js";
import db from "./firebaseConfig";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function App() {
  //replace with this in the future: https://github.com/spotify/web-api-auth-examples
  const token = window.location.hash.slice(14).split("&")[0];
  const clientId = "f5b9df7177184266a5de8eb2c679b982";
  const redirectUri = "http://localhost:3000/";
  //http://localhost:3000/
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

  //state of song
  const [state, setState] = useState();
  const [uri, setURI] = useState();
  const [paused, setPaused] = useState();
  const [position, setPosition] = useState();
  const [sdk, setSdk] = useState();

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
    return fetch(`${SPOTIFY_API_URL}/search?q=${q}&type=track&limit=30`, {
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

      sdk.addListener("player_state_changed", (state) => {
        setState(state);
        setPaused(state.paused);
        setURI(state.track_window.current_track.uri);
      });
    })();
  }, []);

  if (sdk) {
    sdk.addListener("player_state_changed", (state) => {
      setPosition(state.position);
    });
  }

  const [listenerJoined, setListenerJoined] = useState(0);
  useEffect(() => {
    console.log("STATE && DEVICEID", state, deviceId);
    if (state && usertype === "host") {
      console.log("URI AND PAUSED", uri, paused);
      db.collection("room").doc(deviceId).set({
        partyname: partyName,
        token: token,
        track: state.track_window.current_track.name,
        artist: state.track_window.current_track.artists[0],
        albumart: state.track_window.current_track.album.images[0].url,
        uri: state.track_window.current_track.uri,
        position: state.position,
        pause: state.paused,
      });
    }
  }, [uri, paused]);

  useEffect(() => {
    if (usertype === "host") {
      spotifyWebApi.setAccessToken(token);
      const interval = setInterval(() => {
        spotifyWebApi.getMyCurrentPlayingTrack().then((data) => {
          let position = data.progress_ms;
          setPosition(position);
          console.log("I AMMMMMMMMMMMMMMM A POSITION", position);
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  });

  //COME BACK TO FIGURE OUT
  useEffect(() => {
    if (state && usertype === "host" && deviceId) {
      console.log(listenerJoined, "IM LISTENINGGGGG");
      console.log("I'M POSITION", position);
      db.collection("room").doc(deviceId).update({
        position: position,
      });
      console.log("IM STILL LISTENINGERERS");
    }
  }, [position]);

  //READING FROM DB
  const [activeRooms, setActiveRooms] = useState([]);
  useEffect(() => {
    const data = db.collection("room");
    data.onSnapshot((snapshot) => {
      const activeRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActiveRooms(activeRooms);
    });
  }, []);

  const [clickedRoom, setClickedRoom] = useState();

  // if (activeRooms) {
  //   let activeRoomURI = activeRooms[0].uri;
  //   let activeRoomPause = activeRooms[0].pause;
  // }
  useEffect(() => {
    if (usertype === "listener") {
      db.collection("listeners").doc(deviceId).set({
        token: token,
        userProfile: userProf,
      });
      console.log("I AM ACTIVE ROOMS URI", activeRooms[0].uri);
      console.log("I AM ACTIVE ROOMS Pause", activeRooms[0].pause);
      const roomArr = activeRooms.filter((room) => {
        return room.id === clickedRoom;
      });
      const room = roomArr[0];

      const trackURI = room.uri;
      const trackPosition = room.position;
      const trackPaused = room.pause;

      if (!trackPaused) {
        spotifyWebApi.setAccessToken(token);
        spotifyWebApi
          .play({
            device_id: deviceId,
            uris: [trackURI],
            position_ms: trackPosition,
          })
          .then((res) => console.log(res));
      }

      if (trackPaused) {
        spotifyWebApi.pause().then((res) => console.log("pause", res));
      }
    }
  }, [usertype, activeRooms]);

  //sign in and get token
  if (!token) {
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <h1>Play.All()</h1>
            <p>
              Play.All() is a new way to share, discover and listen to music.
              Host a room and share your music with the world, or Join a room
              and discover music.
            </p>

            <div className={"circle-btn"}>
              <a href={authURL} target="popup">
                <div className={"circle"}>
                  <p>Listen ♫</p>
                </div>
              </a>
            </div>
          </header>
        </div>
        <Animate />
      </div>
    );
  }

  //get listener type
  else if (usertype === "none") {
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <p>Logged in as {userProf.display_name}</p>
            <div className="flexbox-container">
              <div>
                <h1>Join a room and listen to music</h1>
                <div className="active-rooms-container">
                  {activeRooms.map((room) => (
                    <div
                      className="active-room"
                      key={room.id}
                      id={room.id}
                      onClick={(e) => {
                        setUsertype("listener");
                        setClickedRoom(e.currentTarget.id);
                        setListenerJoined(listenerJoined + 1);
                      }}
                    >
                      <p>
                        {room.partyname} is now playing {room.track}
                      </p>
                      <img src={room.albumart}></img>
                    </div>
                  ))}
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
      // if (deviceId) {
      //   db.collection("room").doc(deviceId).set({
      //     partyname: partyName,
      //     token: token,
      //   });
      // }

      return (
        <div>
          <header className="App-header">
            <h1>Search for a song to play at {partyName}</h1>
            <div className={"flexbox-container-row"}>
              <form onSubmit={searchHandler}>
                <input
                  type="text"
                  onChange={queryHandler}
                  placeholder="search for a song"
                ></input>
                <input type="submit" value="search"></input>
              </form>
              <button
                onClick={() => {
                  spotifyWebApi.setAccessToken(token);
                  spotifyWebApi
                    .pause()
                    .then((res) => console.log("pause", res));
                }}
              >
                Pause Music
              </button>
              <button
                onClick={() => {
                  setUsertype("none");
                  //setState("");
                  spotifyWebApi.setAccessToken(token);
                  spotifyWebApi
                    .pause()
                    .then((res) => console.log("pause", res));
                }}
              >
                Back
              </button>
            </div>
            <div className={"search-result"}>
              {sResults !== [] &&
                resultsToggle &&
                sResults.map((track) => (
                  <img
                    src={track.album.images[1].url}
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
          </header>
        </div>
      );
    }
  } else if (usertype === "listener") {
    // if (dbPause) {
    //   console.log("PAUSED");
    //   // spotifyWebApi.setAccessToken(token);
    //   // spotifyWebApi.pause().then((res) => console.log("pause", res));
    // } else if (!dbPause) {
    //   console.log("IM NOT PAUSED YOU FOO");
    // }
    console.log("clicked Room Information", clickedRoom);
    return (
      <div>
        <div className="App">
          <header className="App-header">
            {/* <p>Party Room: {room.partyname}</p>
            <p>
              You're listening to {room.track} by {room.artist.name}
              <br></br>
              <img src={room.albumart}></img>
              <br></br>
              Paused? {room.pause}
              <br></br>
              Position: {room.position}
              <br></br>
              Track URI: {room.uri}
              <br></br>
            </p> */}
            <button
              onClick={() => {
                setUsertype("none");
                spotifyWebApi.setAccessToken(token);
                spotifyWebApi.pause().then((res) => console.log("pause", res));
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
