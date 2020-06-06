//only read the position when listener gets added to the db
//display how many listeners there are in the host room
//delete document when host leaves the room
//add mute or volume button to listener room

import React, { useRef, useState, useEffect } from "react";
import Splash from "./Splash";
import ChooseRoom from "./ChooseRoom";
import ChooseRoomName from "./ChooseRoomName";
import ChooseSong from "./ChooseSong";
import ListenRoom from "./ListenRoom";
import PlayAllRoom from "./PlayAllRoom";
import useScript from "react-script-hook";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import db from "./firebaseConfig";
import { useBeforeunload } from "react-beforeunload";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();
require("dotenv").config();

function App() {
  //consistent login
  const [token, setToken] = useState("");
  useEffect(() => {
    if (localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
    } else {
      setToken(window.location.hash.slice(14).split("&")[0]);
      localStorage.setItem("token", token);
    }
  }, [token]);

  //get user profile if token value changes
  const [userProf, setUserProf] = useState();
  const [displayName, setDisplayName] = useState();
  const [avatar, setAvatar] = useState(
    "https://miro.medium.com/max/720/1*W35QUSvGpcLuxPo3SRTH4w.png"
  );
  useEffect(() => {
    if (token) {
      spotifyWebApi.setAccessToken(token);
      spotifyWebApi
        .getMe()
        .then((res) => {
          return res;
        })
        .then((profile) => {
          setUserProf(profile);
          setDisplayName(profile.display_name);
        });
    }
  }, [token]);

  //write user into db
  useEffect(() => {
    if (deviceId) {
      db.collection("users").doc(deviceId).set({
        user: userProf,
      });
    }
  }, []);

  //load Spotify SDK script
  const [loading, error] = useScript({
    src: "https://sdk.scdn.co/spotify-player.js",
    onload: () => console.log("Script loaded"),
  });

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
  const [currentAlbumArt, setCurrentAlbumArt] = useState(
    "https://image.flaticon.com/icons/png/512/13/13510.png"
  );
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
    return fetch(
      `${SPOTIFY_API_URL}/search?q=${q}*&type=album,artist,track,playlist&limit=32`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        setSResults(res.tracks.items);
      })
      .catch(errHandler);
  };
  //end of search logic

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
        volume: 0.1,
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
        setDeviceId(device_id);
      });

      sdk.addListener("player_state_changed", (state) => {
        setState(state);
        setPaused(state.paused);
        setURI(state.track_window.current_track.uri);
        setCurrentTrack(state.track_window.current_track.name);
        setCurrentArtist(state.track_window.current_track.artists[0].name);
        setCurrentAlbumArt(
          state.track_window.current_track.album.images[1].url
        );
      });
    })();
  }, [token]);

  if (sdk) {
    sdk.addListener("player_state_changed", (state) => {
      setPosition(state.position);
    });
  }

  //WRITING TO DB
  const [listenerJoined, setListenerJoined] = useState(0);
  useEffect(() => {
    if (state && usertype === "host") {
      db.collection("room").doc(deviceId).set({
        partyname: partyName,
        token: token,
        track: state.track_window.current_track.name,
        artist: state.track_window.current_track.artists[0],
        albumart: state.track_window.current_track.album.images[0].url,
        uri: state.track_window.current_track.uri,
        position: state.position,
        pause: state.paused,
        host: userProf,
      });
    }
  }, [uri, paused]);

  //READING FROM DB HAPPENS EVERY 5 SECONDS WHEN THE POSITION VALUE CHANGES / WHEN ANY OF THE OTHER VALUES CHANGE
  const [activeRooms, setActiveRooms] = useState([]);
  const [activeListeners, setActiveListeners] = useState();
  useEffect(() => {
    const data = db.collection("room");
    data.onSnapshot((snapshot) => {
      const activeRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActiveRooms(activeRooms);
    });

    const data2 = db.collection("listeners");
    data2.onSnapshot((snapshot) => {
      const activeListeners = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActiveListeners(activeListeners);
    });
  }, []);

  //CHANGING POSITION VARIABLE EVERY 5 SECONDS
  useEffect(() => {
    if (usertype === "host") {
      spotifyWebApi.setAccessToken(token);
      const interval = setInterval(() => {
        spotifyWebApi.getMyCurrentPlayingTrack().then((data) => {
          let position = data.progress_ms;
          setPosition(position);
        });
      }, 5000);
      console.log(position, "IM A POSITION FOR HOST");
      return () => clearInterval(interval);
    }
  });

  //UPDATING DB EVERY TIME POSITION VARIABLE CHANGES
  useEffect(() => {
    if (state && usertype === "host" && deviceId) {
      db.collection("room").doc(deviceId).update({
        position: position,
      });
    }
  }, [position]);

  //currently playing for listener
  const [clickedRoom, setClickedRoom] = useState();
  const [listeningArtist, setListeningArtist] = useState();
  const [listeningTrack, setListeningTrack] = useState();
  const [listeningRoom, setListeningRoom] = useState();
  const [listeningArtwork, setListeningArtwork] = useState();
  const [listeningURI, setListeningURI] = useState();
  const [listeningPaused, setListeningPaused] = useState();
  const [listeningPosition, setListeningPosition] = useState();
  const [hostInfo, setHostInfo] = useState();

  //WHENEVER DB IS READ AND ACTIVEROOMS VALUE CHANGES, LISTENINGPOSITION IS UPDATED
  useEffect(() => {
    if (usertype === "listener" && !playAllRoom) {
      const roomArr = activeRooms.filter((room) => {
        return room.id === clickedRoom;
      });
      const room = roomArr[0];

      const trackURI = room.uri;
      const trackPosition = room.position;
      const trackPaused = room.pause;
      const trackArtist = room.artist.name;
      const roomName = room.partyname;
      const trackName = room.track;
      const trackArtwork = room.albumart;
      const hostProf = room.host;

      setListeningArtist(trackArtist);
      setListeningTrack(trackName);
      setListeningRoom(roomName);
      setListeningArtwork(trackArtwork);
      setListeningURI(trackURI);
      setListeningPaused(trackPaused);
      setListeningPosition(trackPosition);
      setHostInfo(hostProf);
    }
  }, [usertype, activeRooms]);

  useEffect(() => {
    if (usertype === "listener" && !playAllRoom) {
      if (!listeningPaused) {
        spotifyWebApi.setAccessToken(token);
        spotifyWebApi
          .play({
            device_id: deviceId,
            uris: [listeningURI],
            position_ms: listeningPosition,
          })
          .then((res) => console.log(res));
      }

      if (listeningPaused) {
        spotifyWebApi.pause().then((res) => console.log("pause", res));
      }
    }
  }, [usertype, listeningPaused]);
  //add usertype so that when you click back into the room, the useEffect runs and music plays
  //if you don't add usertype, if you exit listening room and rejoin listening room, the music does not play

  //If you set position_ms to 0, when you join for the first time, position is zero even though it shouldn't be but everything after the first song is synced
  //If you set position_ms to listeningPosition, it syncs the first time you join the room but if host changes song, the position is read from the previous songs position
  useEffect(() => {
    if (usertype === "listener" && !playAllRoom) {
      if (!listeningPaused) {
        spotifyWebApi.setAccessToken(token);
        spotifyWebApi
          .play({
            device_id: deviceId,
            uris: [listeningURI],
            position_ms: 0,
          })
          .then((res) => console.log(res));
      }
    }

    if (listeningPaused) {
      spotifyWebApi.pause().then((res) => console.log("pause", res));
    }
  }, [listeningURI]);

  //DELETE FROM DB - doesn't work if host is still playing music
  useBeforeunload(() => {
    setToken("");
    localStorage.removeItem("token");
    db.collection("room").doc(deviceId).delete();
    db.collection("listeners").doc(deviceId).delete();
  });

  //PLAY ALL ROOM
  const [playAllRoom, setPlayAllRoom] = useState(false);
  const [playAllTrack, setPlayAllTrack] = useState();
  const [playAllArtwork, setPlayAllArtwork] = useState();
  const [playAllArtist, setPlayAllArtist] = useState();

  //add listener information to db when usertype changes
  //   useEffect(() => {
  // if(usertype === "listener" || usertype === "playroom") {
  //   db.collection("listeners").doc(deviceId).set({

  //   });
  // }
  //   }, [usertype])

  //sign in and get token
  if (!token) {
    return <Splash />;
  }

  //choose room
  else if (usertype === "none") {
    return (
      <ChooseRoom
        deviceId={deviceId}
        setUsertype={setUsertype}
        activeRooms={activeRooms}
        setClickedRoom={setClickedRoom}
        setListenerJoined={setListenerJoined}
        listenerJoined={listenerJoined}
        listeningPaused={listeningPaused}
        token={token}
        listeningURI={listeningURI}
        listeningPosition={listeningPosition}
        setPlayAllRoom={setPlayAllRoom}
        listeningRoom={listeningRoom}
        listeningArtwork={listeningArtwork}
        listeningTrack={listeningTrack}
        listeningArtist={listeningArtist}
        displayName={displayName}
        avatar={avatar}
        userProf={userProf}
      />
    );
  }

  //host page
  else if (usertype === "host") {
    if (!partyName)
      return (
        <ChooseRoomName
          setUsertype={setUsertype}
          partyNameInput={partyNameInput}
          setPartyName={setPartyName}
          displayName={displayName}
          avatar={avatar}
        />
      );
    if (partyName) {
      return (
        <ChooseSong
          displayName={displayName}
          avatar={avatar}
          setUsertype={setUsertype}
          partyName={partyName}
          searchHandler={searchHandler}
          queryHandler={queryHandler}
          nowPlaying={nowPlaying}
          currentAlbumArt={currentAlbumArt}
          currentTrack={currentTrack}
          currentArtist={currentArtist}
          token={token}
          deviceId={deviceId}
          uri={uri}
          position={position}
          sResults={sResults}
          resultsToggle={resultsToggle}
          activeListeners={activeListeners}
          clickedRoom={clickedRoom}
        />
      );
    }
  }

  //listener page
  else if (usertype === "listener" && !playAllRoom) {
    return (
      <ListenRoom
        setUsertype={setUsertype}
        token={token}
        deviceId={deviceId}
        listeningRoom={listeningRoom}
        listeningArtwork={listeningArtwork}
        listeningTrack={listeningTrack}
        listeningArtist={listeningArtist}
        listeningPaused={listeningPaused}
        displayName={displayName}
        avatar={avatar}
        activeListeners={activeListeners}
        clickedRoom={clickedRoom}
        hostInfo={hostInfo}
      />
    );
  } else if (usertype === "playroom" && playAllRoom) {
    return (
      <PlayAllRoom
        setUsertype={setUsertype}
        token={token}
        deviceId={deviceId}
        state={state}
        playAllTrack={playAllTrack}
        setPlayAllTrack={setPlayAllTrack}
        playAllArtwork={playAllArtwork}
        setPlayAllArtwork={setPlayAllArtwork}
        playAllArtist={playAllArtist}
        setPlayAllArtist={setPlayAllArtist}
        setPlayAllRoom={setPlayAllRoom}
        displayName={displayName}
        avatar={avatar}
        activeListeners={activeListeners}
      />
    );
  } else {
    console.log("ERR");
  }
}

export default App;
