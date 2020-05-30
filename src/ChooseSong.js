import React, { useState } from "react";
import Queue from "./Queue";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function ChooseSong({
  setUsertype,
  partyName,
  searchHandler,
  queryHandler,
  nowPlaying,
  currentAlbumArt,
  currentTrack,
  currentArtist,
  token,
  deviceId,
  uri,
  position,
  sResults,
  resultsToggle,
}) {
  //add to queue
  const [queue, setQueue] = useState([]);
  const errHandler = (err) => {
    console.log("Unable to load song");
    console.log(err);
  };
  const addToQueue = (trackURI) => {
    return fetch(`https://api.spotify.com/v1/me/player/queue?uri=${trackURI}`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res, "addToQueue response");
      })
      .catch(errHandler);
  };
  //end of add queue logic
  return (
    <div className={"search-page-page"}>
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
      <div className={"search-page"}>
        <h1>Search for a song to play at {partyName}</h1>
        <div className={"search-bar-now-playing"}>
          <form onSubmit={searchHandler} className="search">
            <input
              className="searchTerm"
              type="text"
              onChange={queryHandler}
              placeholder="search for a song"
            ></input>
            <input className="searchButton" type="submit" value="🔎"></input>
          </form>
          <div ref={nowPlaying} className={"now-playing"}>
            <img src={currentAlbumArt} alt="album-art"></img>
            <p className={"now-playing-text"}>
              Now Playing: {currentTrack} - {currentArtist} at {partyName}
            </p>
            <FontAwesomeIcon
              icon={faPlay}
              size="2x"
              onClick={() => {
                spotifyWebApi.setAccessToken(token);
                spotifyWebApi.play({
                  device_id: deviceId,
                  uris: [uri],
                  position_ms: position,
                });
              }}
            />
            <FontAwesomeIcon
              className={"pause"}
              icon={faPause}
              size="2x"
              onClick={() => {
                spotifyWebApi.setAccessToken(token);
                spotifyWebApi.pause().then((res) => console.log("pause", res));
              }}
            />
          </div>
          <Queue queue={queue} />
        </div>
        <div className={"search-results"}>
          {sResults !== [] &&
            resultsToggle &&
            sResults.map((track, i) => (
              <div className={"result"}>
                <img
                  key={i}
                  alt={"album-art"}
                  src={track.album.images[1].url}
                ></img>
                <FontAwesomeIcon
                  icon={faPlay}
                  size="2x"
                  className={"play-btn"}
                  onClick={() => {
                    nowPlaying.current.style.display = "flex";
                    spotifyWebApi.setAccessToken(token);
                    spotifyWebApi.play({
                      device_id: deviceId,
                      uris: [track.uri],
                    });
                  }}
                />
                <button
                  onClick={() => {
                    addToQueue(track.uri);
                    queue.push({
                      albumart: track.album.images[1].url,
                      artist: track.artists[0].name,
                      name: track.name,
                    });
                  }}
                >
                  ADD TO QUEUE
                </button>
                <div className={"result-track-details"}>
                  <p className={"track-title"}>{track.name}</p>
                  <p className={"artist-name"}>{track.artists[0].name}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ChooseSong;
