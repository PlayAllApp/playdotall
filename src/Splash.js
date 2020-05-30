import React from "react";

function Splash() {
  //set URL for button click;
  const clientId = "f5b9df7177184266a5de8eb2c679b982";
  const redirectUri = "http://localhost:3000/";
  //http://localhost:3000/
  //https://playdotall.web.app/
  const scopes = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
  ];
  const authEndpoint = "https://accounts.spotify.com/authorize";
  const authURL = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    "%20"
  )}&response_type=token&show_dialog=true`;

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
