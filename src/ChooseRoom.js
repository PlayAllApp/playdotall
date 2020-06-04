import React, { useState, useEffect } from "react";
import "all-animation";
import "animate.css";
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
    "https://image.flaticon.com/icons/png/512/13/13510.png"
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
      <p className="room-select flip-left">
        Make a
        <button
          className={"make-room-btn"}
          onClick={() => {
            setUsertype("host");
          }}
        >
          ROOM
        </button>
        and share music or join one of the rooms below and listen to music
      </p>
      <div className="active-room-container">
        <div className="active-room">
          <div
            className="container"
            onClick={() => {
              setUsertype("playroom");
              setPlayAllRoom(true);
            }}
          >
            <div className="album">
              <img src={playlistArtwork} alt="album-art"></img>
            </div>
            <div className="record">
              <img src="http://upload.wikimedia.org/wikipedia/commons/a/ae/Record2.png" />
            </div>
          </div>
        </div>
        <p>
          <span className="room-info">Play.All(▶) Jams</span> room
        </p>
      </div>
      {activeRooms.map((room) => (
        <div className="active-room-container">
          <div className="active-room">
            <div
              className="container"
              key={room.id}
              id={room.id}
              onClick={(e) => {
                setUsertype("listener");
                setClickedRoom(e.currentTarget.id);
                setListenerJoined(listenerJoined + 1);
              }}
            >
              <div className="album">
                <img src={room.albumart} alt="album-art"></img>
              </div>
              <div className="record">
                <img src="http://upload.wikimedia.org/wikipedia/commons/a/ae/Record2.png" />
              </div>
            </div>
          </div>
          <p>
            <span className="room-info">{room.partyname}</span> room is now
            playing <span className="room-info">{room.track}</span>
          </p>
        </div>
      ))}
      <div className={"box"}>
        <div class="wave -one"></div>
        <div class="wave -two"></div>
        <div class="wave -three"></div>
      </div>
    </div>
  );
}

export default ChooseRoom;
