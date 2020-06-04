import React from "react";
import Spotify from "spotify-web-api-js";
import Volume from "./Volume.js";
const spotifyWebApi = new Spotify();

function ListenRoom({
  setUsertype,
  token,
  listeningRoom,
  listeningArtwork,
  listeningTrack,
  listeningArtist,
  listeningPaused,
  avatar,
  displayName,
}) {
  if (listeningPaused) {
    return (
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
          <div className="avatar-displayname">
            <img src={avatar}></img>
            <p>{displayName}</p>
          </div>
        </header>
        <div className="listener-information">
          <h1>Welcome to {listeningRoom} ♫</h1>
          <p>
            The host is currently away and the music is on pause. <br></br>Come
            back later or find a different room to join!
          </p>
          <img src={listeningArtwork} className={"rotating"}></img>
          <p>
            Currently paused: {listeningTrack} by {listeningArtist}
          </p>
          <div className={"listen-room-volume"}>
            <Volume token={token} />
          </div>
        </div>
        <div className={"box"}>
          <div class="wave -one"></div>
          <div class="wave -two"></div>
          <div class="wave -three"></div>
        </div>
      </div>
    );
  } else {
    return (
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
          <div className="avatar-displayname">
            <img src={avatar}></img>
            <p>{displayName}</p>
          </div>
        </header>
        <div className="listener-information">
          <h1>Welcome to {listeningRoom} ♫</h1>
          <img src={listeningArtwork} className={"rotating"}></img>
          <p>
            Currently playing: {listeningTrack} by {listeningArtist}
          </p>
          <div className={"listen-room-volume"}>
            <Volume token={token} />
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
}

export default ListenRoom;
