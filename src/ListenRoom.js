import React from "react";
import Spotify from "spotify-web-api-js";
import Volume from "./Volume.js";
import db from "./firebaseConfig";
const spotifyWebApi = new Spotify();

function ListenRoom({
  setUsertype,
  token,
  deviceId,
  listeningRoom,
  listeningArtwork,
  listeningTrack,
  listeningArtist,
  listeningPaused,
  avatar,
  displayName,
  activeListeners,
  clickedRoom,
  hostInfo,
}) {
  //hostInfo
  let hostDisplayName = "";
  if (hostInfo) {
    hostDisplayName = hostInfo.display_name;
  }
  //get listeners
  const playRoomListeners = activeListeners.filter((obj) => {
    return obj.id === clickedRoom;
  });
  const numListeners = playRoomListeners.length;
  if (listeningPaused) {
    return (
      <div className="listener-page">
        <header className="room-choice-header">
          <h1
            className="logo"
            onClick={() => {
              setUsertype("none");
              db.collection("listeners").doc(deviceId).delete();
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
        <h1>
          Welcome to {listeningRoom} ♫ Music Selection by {hostDisplayName}
        </h1>
        <p>
          The host is currently away and the music is on pause. <br></br>Come
          back later or find a different room to join!
        </p>
        <div className="listener-information">
          <div className={"player-information"}>
            <p>
              Currently paused: {listeningTrack} by {listeningArtist}
            </p>
            <img src={listeningArtwork} className={"rotating"}></img>
            <div className={"listen-room-volume"}>
              <Volume token={token} />
            </div>
          </div>
          <div className="num-of-listeners">
            <h2>{numListeners} listeners</h2>
            {playRoomListeners.map((obj) => (
              <div>
                <p>{obj.listener.display_name} 🎧</p>
              </div>
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
  } else {
    return (
      <div className="listener-page">
        <header className="room-choice-header">
          <h1
            className="logo"
            onClick={() => {
              setUsertype("none");
              db.collection("listeners").doc(deviceId).delete();
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
        <h1>
          Welcome to {listeningRoom} ♫ Music Selection by {hostDisplayName}
        </h1>
        <div className="listener-information">
          <div className={"player-information"}>
            <p>
              Currently playing: {listeningTrack} by {listeningArtist}
            </p>
            <img src={listeningArtwork} className={"rotating"}></img>
            <div className={"listen-room-volume"}>
              <Volume token={token} />
            </div>
          </div>
          <div className="num-of-listeners">
            <h2>{numListeners} listeners</h2>
            {playRoomListeners.map((obj) => (
              <div>
                <p>{obj.listener.display_name} 🎧</p>
              </div>
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
}

export default ListenRoom;
