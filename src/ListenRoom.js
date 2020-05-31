import React from "react";
import { useBeforeunload } from "react-beforeunload";
import db from "./firebaseConfig";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function ListenRoom({
  setUsertype,
  token,
  listeningRoom,
  listeningArtwork,
  listeningTrack,
  listeningArtist,
  listeningPaused,
  deviceId,
}) {
  //delete from db
  useBeforeunload(() => {
    db.collection("room").doc(deviceId).delete();
    db.collection("listeners").doc(deviceId).delete();
  });
  if (listeningPaused) {
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
            <p>
              The host is currently away and the music is on pause. Come back
              later or find a different room to join!
            </p>
            <img src={listeningArtwork}></img>
            <p>
              Current track: {listeningTrack} by {listeningArtist}
            </p>
          </div>
        </div>
      </div>
    );
  } else {
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
              Currently track: {listeningTrack} by {listeningArtist}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default ListenRoom;
