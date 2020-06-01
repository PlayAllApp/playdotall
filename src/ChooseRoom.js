import React from "react";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function ChooseRoom({
  setUsertype,
  activeRooms,
  setClickedRoom,
  setListenerJoined,
  listenerJoined,
  listeningPaused,
  token,
  deviceId,
  listeningURI,
  listeningPosition,
}) {
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
          {activeRooms.map((room) => (
            <div
              className="active-room"
              key={room.id}
              id={room.id}
              onClick={(e) => {
                setUsertype("listener");
                setClickedRoom(e.currentTarget.id);
                setListenerJoined(listenerJoined + 1);
                //
                if (!listeningPaused) {
                  spotifyWebApi.setAccessToken(token);
                  spotifyWebApi
                    .play({
                      device_id: deviceId,
                      uris: [listeningURI],
                      position_ms: listeningPosition,
                    })
                    .then((res) => console.log(res));
                }
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
