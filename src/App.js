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
import useScript from "react-script-hook";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import db from "./firebaseConfig";
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
    return fetch(
      `${SPOTIFY_API_URL}/search?q=${q}&type=album,artist,track,playlist&limit=32`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        setSResults(res.tracks.items);

        console.log(res, "IM A RES??");
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
        console.log("state changed", state);
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

  //READING FROM DB
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

  useEffect(() => {
    if (usertype === "listener") {
      const roomArr = activeRooms.filter((room) => {
        return room.id === clickedRoom;
      });
      const room = roomArr[0];

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
      setListeningURI(trackURI);
      setListeningPaused(trackPaused);
      setListeningPosition(trackPosition);
    }
  }, [usertype, activeRooms]);

  useEffect(() => {
    if (usertype === "listener") {
      if (!listeningPaused) {
        spotifyWebApi.setAccessToken(token);
        spotifyWebApi
          .play({
            device_id: deviceId,
            uris: [listeningURI],
            position_ms: position,
          })
          .then((res) => console.log(res));
      }

      if (listeningPaused) {
        spotifyWebApi.pause().then((res) => console.log("pause", res));
      }
    }
  }, [usertype, listeningURI, listeningPaused, listeningPosition]);

  //sign in and get token
  if (!token) {
    return <Splash />;
  }

  //choose room
  else if (usertype === "none") {
    return (
      <ChooseRoom
        setUsertype={setUsertype}
        activeRooms={activeRooms}
        setClickedRoom={setClickedRoom}
        setListenerJoined={setListenerJoined}
        listenerJoined={listenerJoined}
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
        />
      );
    if (partyName) {
      return (
        <ChooseSong
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
          // queue={queue}
          // addToQueue={addToQueue}
          sResults={sResults}
          resultsToggle={resultsToggle}
        />
      );
    }
  }

  //listener page
  else if (usertype === "listener") {
    return (
      <ListenRoom
        setUsertype={setUsertype}
        token={token}
        listeningRoom={listeningRoom}
        listeningArtwork={listeningArtwork}
        listeningTrack={listeningTrack}
        listeningArtist={listeningArtist}
      />
    );
  } else {
    console.log("ERR");
  }
}

export default App;
