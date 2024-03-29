import React, { useEffect } from "react";
import Volume from "./Volume.js";
import db from "./firebaseConfig";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function PlayAllRoom({
  setUsertype,
  token,
  deviceId,
  state,
  playAllTrack,
  setPlayAllTrack,
  playAllArtwork,
  setPlayAllArtwork,
  playAllArtist,
  setPlayAllArtist,
  setPlayAllRoom,
  avatar,
  displayName,
  activeListeners,
}) {
  function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  const playMusic = () => {
    const trackNumber = getRandomNumberBetween(0, 414);
    const body = JSON.stringify({
      context_uri: "spotify:playlist:6LkiQLx9dAxapLTvFFJFYa",
      offset: { position: trackNumber },
    });
    return fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: body,
      }
    )
      .then((res) => res.json())
      .then((res) => {
        console.log(res, "addToQueue response");
      })
      .catch(errHandler);
  };

  const errHandler = (err) => {
    console.log("Unable to load song");
    console.log(err);
  };

  const getCurrentlyListening = () => {
    return fetch(`https://api.spotify.com/v1/me/player/currently-playing`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((track) => {
        setPlayAllTrack(track.item.name);
        setPlayAllArtwork(track.item.album.images[1].url);
        setPlayAllArtist(track.item.artists[0].name);
      })
      .catch(errHandler);
  };

  useEffect(() => {
    playMusic();
  }, [deviceId]);

  useEffect(() => {
    getCurrentlyListening();
  }, [state]);

  //array of objects with deviceId, listener profile, room name
  console.log(activeListeners);
  const playRoomListeners = activeListeners.filter((obj) => {
    return obj.room === "playroom";
  });
  const numListeners = playRoomListeners.length;

  return (
    <div className="listener-page">
      <header className="room-choice-header">
        <h1
          className="logo"
          onClick={() => {
            db.collection("listeners").doc(deviceId).delete();
            setUsertype("none");
            setPlayAllRoom(false);
            spotifyWebApi.setAccessToken(token);
            spotifyWebApi.pause().then((res) => console.log("pause", res));
          }}
        >
          Play.All(▶)
        </h1>
        <div className="avatar-displayname">
          <img src={avatar}></img>
          <p>{displayName}</p>
        </div>
      </header>
      <h1>Welcome to Play.All(▶) Jamz ♫</h1>
      <div className="listener-information">
        <div className={"player-information"}>
          <p>
            Current track: {playAllTrack} by {playAllArtist}
          </p>
          <img src={playAllArtwork} className={"rotating"}></img>
          <div className={"listen-room-volume"}>
            <Volume token={token} />
          </div>
        </div>
        <div className="num-of-listeners">
          <h2>{numListeners} listeners</h2>
          {playRoomListeners.map((obj) => (
            <p>{obj.listener.display_name} 🎧</p>
          ))}
        </div>
      </div>
      <div className={"box"}>
        <div class="wave -one"></div>
        <div class="wave -two"></div>
        <div class="wave -three"></div>
      </div>
    </div>
  );
}

export default PlayAllRoom;
