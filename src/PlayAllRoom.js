import React, { useEffect } from "react";
import { useBeforeunload } from "react-beforeunload";
import db from "./firebaseConfig";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function PlayAllRoom({
  setUsertype,
  token,
  deviceId,
  setListeningArtist,
  setListeningTrack,
  setListeningRoom,
  setListeningArtwork,
  setListeningPosition,
  listeningRoom,
  listeningArtwork,
  listeningTrack,
  listeningArtist,
  listeningPosition,
  state,
  trackNumber,
  setTrackNumber,
}) {
  //delete from db
  useBeforeunload(() => {
    db.collection("room").doc(deviceId).delete();
    db.collection("listeners").doc(deviceId).delete();
  });
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
        setListeningTrack(track.item.name);
        setListeningRoom("Play.All() Jams");
        setListeningArtwork(track.item.album.images[1].url);
        setListeningArtist(track.item.artists[0].name);
      })
      .catch(errHandler);
  };

  useEffect(() => {
    playMusic();
  }, [deviceId]);

  useEffect(() => {
    getCurrentlyListening();
  }, [state]);

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
          <div className="listener-track-container">
            <img src={listeningArtwork}></img>
            <p>
              Current track: {listeningTrack} by {listeningArtist}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayAllRoom;
