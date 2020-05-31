import React, { useState, useEffect } from "react";
import { useBeforeunload } from "react-beforeunload";
import db from "./firebaseConfig";

function ChooseRoom({
  setUsertype,
  activeRooms,
  setClickedRoom,
  setListenerJoined,
  listenerJoined,
  setPlayAllRoom,
  listeningRoom,
  listeningArtwork,
  listeningTrack,
  listeningArtist,
  token,
  deviceId,
}) {
  //delete from db
  useBeforeunload(() => {
    db.collection("room").doc(deviceId).delete();
    db.collection("listeners").doc(deviceId).delete();
  });
  const [playlistArtwork, setPlaylistArtwork] = useState();
  const getPlaylistImage = () => {
    return fetch(
      `https://api.spotify.com/v1/playlists/6LkiQLx9dAxapLTvFFJFYa/images`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((artwork) => {
        console.log("figuring out offset", artwork[1].url);
        setPlaylistArtwork(artwork[1].url);
      })
      .catch(errHandler);
  };
  const errHandler = (err) => {
    console.log("Unable to load song");
    console.log(err);
  };
  useEffect(() => {
    getPlaylistImage();
  }, []);
  if (
    !listeningRoom &&
    !listeningArtwork &&
    !listeningTrack &&
    !listeningArtist
  ) {
    return (
      <div className="room-choice-page">
        <header className="room-choice-header">
          <h1 className="logo">Play.All(▶)</h1>
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
                setUsertype("listener");
                setPlayAllRoom(true);
              }}
            >
              <img src={playlistArtwork} alt="album-art"></img>
              <p>
                The <span className="room-info">Play.All() Jams</span> room is
                now playing: <span className="room-info">Blue World</span>
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
                  The <span className="room-info">{room.partyname}</span> room
                  is now playing:{" "}
                  <span className="room-info">{room.track}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="room-choice-page">
        <header className="room-choice-header">
          <h1 className="logo">Play.All(▶)</h1>
        </header>
        <h2 className="room-select">
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
        </h2>
        <div>
          <div className="active-rooms-container">
            <div
              className="active-room"
              onClick={() => {
                setUsertype("listener");
                setPlayAllRoom(true);
              }}
            >
              <img src={playlistArtwork} alt="album-art"></img>
              <p>
                The <span className="room-info">{listeningRoom}</span> room is
                now playing: <span className="room-info">{listeningTrack}</span>
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
                  The <span className="room-info">{room.partyname}</span> room
                  is now playing:{" "}
                  <span className="room-info">{room.track}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default ChooseRoom;
