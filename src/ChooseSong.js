import React, { useState, useRef } from "react";
import Queue from "./Queue";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import db from "./firebaseConfig";
import Volume from "./Volume.js";
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
  avatar,
  displayName,
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
  const playerControl = useRef();
  return (
    <div className={"search-page-page"}>
      <header className="room-choice-header">
        <h1
          className="logo"
          onClick={() => {
            spotifyWebApi.setAccessToken(token);
            spotifyWebApi.pause().then((res) => console.log("pause", res));
            setUsertype("none");
            db.collection("room").doc(deviceId).update({
              pause: true,
            });
          }}
        >
          Play.All(▶)
        </h1>
        <div className="avatar-displayname">
          <img src={avatar}></img>
          <p>{displayName}</p>
        </div>
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
            <img
              className={"rotating"}
              src={currentAlbumArt}
              alt="album-art"
            ></img>
            <p className={"now-playing-text"}>
              Now Playing: {currentTrack} - {currentArtist} at {partyName}
            </p>

            <Volume token={token} />
            <FontAwesomeIcon
              className={"play"}
              icon={faPlay}
              size="1x"
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
              size="1x"
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
                <div className={"image-icon"}>
                  <img
                    key={i}
                    alt={"album-art"}
                    src={track.album.images[1].url}
                    onClick={() => {
                      nowPlaying.current.style.display = "flex";
                      spotifyWebApi.setAccessToken(token);
                      spotifyWebApi.play({
                        device_id: deviceId,
                        uris: [track.uri],
                      });
                      queue.push({
                        albumart: track.album.images[1].url,
                        artist: track.artists[0].name,
                        name: track.name,
                      });
                    }}
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
                      queue.push({
                        albumart: track.album.images[1].url,
                        artist: track.artists[0].name,
                        name: track.name,
                      });
                    }}
                  />
                </div>

                <div className={"result-track-details"}>
                  <p className={"track-title"}>{track.name}</p>
                  <p className={"artist-name"}>{track.artists[0].name}</p>
                </div>
                <button
                  className={"que-button"}
                  onClick={() => {
                    addToQueue(track.uri);
                    queue.push({
                      albumart: track.album.images[1].url,
                      artist: track.artists[0].name,
                      name: track.name,
                    });
                  }}
                >
                  Add to playlist
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ChooseSong;
