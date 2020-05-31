import React from "react";
import { useBeforeunload } from "react-beforeunload";
import db from "./firebaseConfig";

function ChooseRoomName({
  setUsertype,
  partyNameInput,
  setPartyName,
  deviceId,
}) {
  //delete from db
  useBeforeunload(() => {
    db.collection("room").doc(deviceId).delete();
    db.collection("listeners").doc(deviceId).delete();
  });
  return (
    <div className="make-room">
      <div>
        <header>
          <header className="room-choice-header">
            <h1
              className="logo"
              onClick={() => {
                setUsertype("none");
              }}
            >
              Play.All(▶)
            </h1>
          </header>
          <p htmlFor="name">Name your room something awesome</p>
          <form>
            <input
              className="party-name-input"
              placeholder="Make a room name!"
              type="text"
              id="name"
              name="name"
              required
              ref={partyNameInput}
            ></input>
            <button
              onClick={() => {
                setPartyName(partyNameInput.current.value);
              }}
            >
              Start playing some music ♫
            </button>
          </form>
        </header>
      </div>
    </div>
  );
}

export default ChooseRoomName;
