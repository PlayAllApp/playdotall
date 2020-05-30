import React from "react";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function ListenRoom({
  setUsertype,
  token,
  listeningRoom,
  listeningArtwork,
  listeningTrack,
  listeningArtist,
}) {
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
          <p>Music selection by</p>
          <img src={listeningArtwork}></img>
          <p>
            Currently playing: {listeningTrack} by {listeningArtist}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ListenRoom;
