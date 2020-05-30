import React from "react";

function Queue({ queue }) {
  if (queue.length > 0) {
    return (
      <div>
        <h1>Playing Next:</h1>
        {queue.map((track) => (
          <div>
            <img src={track.albumart} alt="album-art"></img>
            <p>
              {track.name} - {track.artist}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default Queue;
