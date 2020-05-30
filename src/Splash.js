import React from "react";

function Splash({ authURL }) {
  return (
    <div>
      <div className="splash-page">
        <h1 className={"splash-page-logo"}>Play.All(▶)</h1>
        <div className={"circle-btn"}>
          <a href={authURL} target="popup">
            <div className={"circle"}>
              <p>Listen ♫</p>
            </div>
          </a>
        </div>
        <p className={"splash-page-text"}>
          Play.All(▶) is a new way to share, discover, and listen to music.
        </p>
        <p className={"splash-page-text"}>
          Host a room and share your music with the world, or join a room to see
          what others are listening to!
        </p>
      </div>
    </div>
  );
}

export default Splash;
