import React from "react";

function Queue() {
  return (
    <div>
      {queue.map((track, i) => (
        <div className={"now-playing"}>
          <img src={track.album.images[0]} alt="album-art"></img>
          <p className={"now-playing-text"}>
            Coming up: {track.name} - {track.artists[0].name}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Queue;
