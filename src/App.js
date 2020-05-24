//only read the position when listener gets added to the db
//display how many listeners there are in the host room
//delete document when host leaves the room
//add mute or volume button to listener room

import React, { useRef, useState, useEffect } from "react";
import useScript from "react-script-hook";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import db from "./firebaseConfig";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function App() {
  //replace with this in the future: https://github.com/spotify/web-api-auth-examples
  const token = window.location.hash.slice(14).split("&")[0];
  const clientId = "f5b9df7177184266a5de8eb2c679b982";
  const redirectUri = "https://playdotall.web.app/";
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

  //currently playing for host
  const [currentTrack, setCurrentTrack] = useState();
  const [currentArtist, setCurrentArtist] = useState();
  const [currentAlbumArt, setCurrentAlbumArt] = useState();
  const nowPlaying = useRef();

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
    return fetch(`${SPOTIFY_API_URL}/search?q=${q}&type=track&limit=32`, {
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

  //currently playing for listener
  const [clickedRoom, setClickedRoom] = useState();
  const [listeningArtist, setListeningArtist] = useState();
  const [listeningTrack, setListeningTrack] = useState();
  const [listeningRoom, setListeningRoom] = useState();
  const [listeningArtwork, setListeningArtwork] = useState();

  // if (activeRooms) {
  //   let activeRoomURI = activeRooms[0].uri;
  //   let activeRoomPause = activeRooms[0].pause;
  // }
  useEffect(() => {
    if (usertype === "listener") {
      console.log("I AM ACTIVE ROOMS URI", activeRooms[0].uri);
      console.log("I AM ACTIVE ROOMS Pause", activeRooms[0].pause);
      const roomArr = activeRooms.filter((room) => {
        return room.id === clickedRoom;
      });
      const room = roomArr[0];

      console.log("ROOOOOM", room);

      db.collection("listeners").doc(deviceId).set({
        token: token,
        userProfile: userProf,
        roomid: clickedRoom,
        room: room,
      });

      const trackURI = room.uri;
      const trackPosition = room.position;
      const trackPaused = room.pause;
      const trackArtist = room.artist.name;
      const roomName = room.partyname;
      const trackName = room.track;
      const trackArtwork = room.albumart;

      setListeningArtist(trackArtist);
      setListeningTrack(trackName);
      setListeningRoom(roomName);
      setListeningArtwork(trackArtwork);

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
        <div className="splash-page">
          <h1 className={"splash-page-logo"}>Play.All(▶)</h1>
          <div className={"circle-btn"}>
            <a href={authURL} target="popup">
              <div className={"circle"}>
                <p>Listen ♫</p>
              </div>
            </a>
          </div>
          <p className={"splash-page-text"}>
            Play.All(▶) is a new way to share, discover, and listen to music.
          </p>
          <p className={"splash-page-text"}>
            Host a room and share your music with the world, or join a room to
            see what others are listening to!
          </p>
        </div>
      </div>
    );
  }

  //get listener type
  else if (usertype === "none") {
    return (
      <div className="room-choice-page">
        <header className="room-choice-header">
          {/* <h4 className="user-name">{userProf.display_name}</h4> */}
          <h1 className="logo">Play.All(▶)</h1>
          {/* <div className="empty-div"></div> */}
        </header>
        <h2 className="room-select">
          Make a
          <button
            className={"make-room-btn"}
            onClick={() => {
              setUsertype("host");
              userProf["type"] = "host";
            }}
          >
            ROOM
          </button>
          and share music or <br></br>
          join one of the rooms below and listen to music
        </h2>
        <div>
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
                <img src={room.albumart}></img>
                <p>
                  The <span className="room-info">{room.partyname}</span> room
                  is now playing:{" "}
                  <span className="room-info">{room.track}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (usertype === "host") {
    if (!partyName)
      return (
        <div className="make-room">
          <div>
            <header>
              <header className="room-choice-header">
                {/* <h4 className="user-name">{userProf.display_name}</h4> */}
                <h1
                  className="logo"
                  onClick={() => {
                    setUsertype("none");
                  }}
                >
                  Play.All(▶)
                </h1>
                {/* <div className="empty-div"></div> */}
              </header>
              {/* <div className="room-container"></div> */}
              <p htmlFor="name">Name your room something awesome</p>
              <input
                className="party-name-input"
                placeholder="Make a room name!"
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
                Start playing some music ♫
              </button>
            </header>
          </div>
        </div>
      );
    if (partyName) {
      return (
        <div className={"search-page-page"}>
          <header className="room-choice-header">
            {/* <h4 className="user-name">{userProf.display_name}</h4> */}
            <h1
              className="logo"
              onClick={() => {
                setUsertype("none");
                spotifyWebApi.setAccessToken(token);
                spotifyWebApi.pause().then((res) => console.log("pause", res));
              }}
            >
              Play.All(▶)
            </h1>
          </header>
          <div className={"search-page"}>
            <h1>Search for a song to play at {partyName}</h1>
            <div className={"search-bar-now-playing"}>
              <form onSubmit={searchHandler} className="search">
                <input
                  className="searchTerm"
                  type="text"
                  onChange={queryHandler}
                  placeholder="search for a song"
                ></input>
                <input
                  className="searchButton"
                  type="submit"
                  value="🔎"
                ></input>
              </form>
              <div ref={nowPlaying} className={"now-playing"}>
                <img src={currentAlbumArt}></img>
                <p className={"now-playing-text"}>
                  Now Playing: {currentTrack} - {currentArtist} at {partyName}
                </p>
                <FontAwesomeIcon
                  icon={faPlay}
                  size="2x"
                  onClick={() => {
                    spotifyWebApi.setAccessToken(token);
                    spotifyWebApi.play({
                      device_id: deviceId,
                      uris: [uri],
                      position_ms: position,
                    });
                  }}
                />
                <FontAwesomeIcon
                  className={"pause"}
                  icon={faPause}
                  size="2x"
                  onClick={() => {
                    spotifyWebApi.setAccessToken(token);
                    spotifyWebApi
                      .pause()
                      .then((res) => console.log("pause", res));
                  }}
                />
              </div>
            </div>
            <div className={"search-results"}>
              {sResults !== [] &&
                resultsToggle &&
                sResults.map((track) => (
                  <div className={"result"}>
                    <img
                      alt={"album-art"}
                      src={track.album.images[1].url}
                      onClick={() => {
                        setCurrentTrack(track.name);
                        setCurrentArtist(track.artists[0].name);
                        setCurrentAlbumArt(track.album.images[1].url);
                        nowPlaying.current.style.display = "flex";
                        spotifyWebApi.setAccessToken(token);
                        spotifyWebApi.play({
                          device_id: deviceId,
                          uris: [track.uri],
                        });
                      }}
                    ></img>
                    <FontAwesomeIcon icon={faPlay} className={"play-btn"} />
                    <div className={"result-track-details"}>
                      <p className={"track-title"}>{track.name}</p>
                      <p className={"artist-name"}>{track.artists[0].name}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
    }
  } else if (usertype === "listener") {
    console.log("clicked Room Information", clickedRoom);
    return (
      <div>
        <div className="listener-page">
          <header className="room-choice-header">
            <h1
              className="logo"
              onClick={() => {
                setUsertype("none");
                spotifyWebApi.setAccessToken(token);
                spotifyWebApi.pause().then((res) => console.log("pause", res));
              }}
            >
              Play.All(▶)
            </h1>
          </header>
          <div className="listener-information">
            <h1>Welcome to {listeningRoom} ♫</h1>
            <img src={listeningArtwork}></img>
            <p>
              Currently playing: {listeningTrack} by {listeningArtist}
            </p>
          </div>
        </div>
      </div>
    );
  } else {
    console.log("ERR");
  }
}

export default App;
