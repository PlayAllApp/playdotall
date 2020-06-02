import React, { useState, useEffect } from "react";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function ChooseRoom({
  setUsertype,
  activeRooms,
  setClickedRoom,
  setListenerJoined,
  listenerJoined,
  setPlayAllRoom,
  token,
  displayName,
  avatar,
}) {
  const [playlistArtwork, setPlaylistArtwork] = useState(
    "https://previews.123rf.com/images/juliarstudio/juliarstudio1604/juliarstudio160401344/55304277-loading-circle-sign-icon-in-flat-style-on-a-yellow-background.jpg"
  );

  const getPlaylistImage = async () => {
    let response = await fetch(
      `https://api.spotify.com/v1/playlists/6LkiQLx9dAxapLTvFFJFYa/images`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    let data = await response.json();
    let artwork = await data[1].url;
    return artwork;
  };
  // const errHandler = (err) => {
  //   console.log("Unable to load song");
  //   console.log(err);
  // };
  useEffect(() => {
    getPlaylistImage().then((artwork) => setPlaylistArtwork(artwork));
  }, []);
  return (
    <div className="room-choice-page">
      <header className="room-choice-header">
        <h1 className="logo">Play.All(▶)</h1>
        <div className="avatar-displayname">
          <img src={avatar}></img>
          <p>{displayName}</p>
        </div>
      </header>
      <p className="room-select">
        Make a
        <button
          className={"make-room-btn"}
          onClick={() => {
            setUsertype("host");
          }}
        >
          ROOM
        </button>
        and share music or <br></br>
        join one of the rooms below and listen to music
      </p>
      <div>
        <div className="active-rooms-container">
          <div
            className="active-room"
            onClick={() => {
              setUsertype("playroom");
              setPlayAllRoom(true);
            }}
          >
            <img src={playlistArtwork} alt="album-art"></img>
            <p>
              The <span className="room-info">Play.All() Jams</span> room
            </p>
          </div>
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
              <img src={room.albumart} alt="album-art"></img>
              <p>
                The <span className="room-info">{room.partyname}</span> room is
                now playing: <span className="room-info">{room.track}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChooseRoom;
